import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, registerables } from "chart.js";
import { Pie, Doughnut } from "react-chartjs-2";
import "./index.css";

// Register all Chart.js components
ChartJS.register(...registerables);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [ingredientData, setIngredientData] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [nutritionSummary, setNutritionSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching user session:", error.message);
        navigate("/login");
      } else {
        setUser(data?.session?.user || null);
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch data once user is authenticated
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch inventory data for category chart
        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory")
          .select(
            `ingredient_id, ingredients(name, ingredients_category(category_name))`
          )
          .eq("user_id", user?.id);

        if (inventoryError) {
          console.error("Error fetching inventory:", inventoryError.message);
        } else {
          // Group data by category
          const groupedData = inventory.reduce((acc, item) => {
            const categoryName =
              item.ingredients?.ingredients_category?.category_name || "Unknown";
            if (!acc[categoryName]) {
              acc[categoryName] = 0;
            }
            acc[categoryName]++;
            return acc;
          }, {});

          setIngredientData(
            Object.entries(groupedData).map(([category_name, total]) => ({
              category_name,
              total,
            }))
          );
        }

        // Fetch nutritional information
        const { data: inventoryForNutrition, error: nutritionError } = await supabase
          .from("inventory")
          .select(`ingredients(nutritional_info)`)
          .eq("user_id", user?.id);

        if (nutritionError) {
          console.error("Error fetching nutritional info:", nutritionError.message);
        } else {
          const nutritionSummary = inventoryForNutrition.reduce((acc, item) => {
            try {
              const nutrition =
                typeof item.ingredients?.nutritional_info === "string"
                  ? JSON.parse(item.ingredients?.nutritional_info)
                  : item.ingredients?.nutritional_info;

              if (nutrition && typeof nutrition === "object") {
                for (const [key, value] of Object.entries(nutrition)) {
                  const numericValue = parseFloat(value);
                  if (!isNaN(numericValue)) {
                    acc[key] = (acc[key] || 0) + numericValue;
                  }
                }
              }
            } catch (error) {
              console.error(
                "Error parsing nutritional_info:",
                item.ingredients?.nutritional_info,
                error.message
              );
            }
            return acc;
          }, {});
          setNutritionSummary(nutritionSummary);
        }

        // Fetch expiring items
        if (user?.id) {
          const { data: expiring, error: expiringError } = await supabase
            .from("inventory")
            .select(`days_left, ingredients(name)`)
            .eq("user_id", user.id)
            .lt("days_left", 3);

          if (expiringError) throw expiringError;
          setExpiringItems(expiring);
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  // Show loading screen while data is being fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  // If there's no data, check if the user is new
  const isNewUser = ingredientData.length === 0 && expiringItems.length === 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {user && <h1>Hi, {user.email}!</h1>}
      </div>

      {isNewUser ? (
        <div className="empty-state">
          <p>To get started, scan a receipt to load your inventory and explore insights about your kitchen.</p>
        </div>
      ) : (
        <>
          <div className="chart-container">
            {/* Chart Card: Total Items in Your Inventory */}
            <div className="chart-card">
              <h2 className="chart-title">Total Ingredients in Your Inventory</h2>
              <Pie
                data={{
                  labels: ingredientData.map((item) => item.category_name || "Unknown"),
                  datasets: [
                    {
                      label: "Ingredients",
                      data: ingredientData.map((item) => item.total || 0),
                      backgroundColor: [
                        "#caabd5", // Condiments
                        "#f58a78", // Meat
                        "#84e2ca", // Vegetables
                        "#fbdd94", // Dairy
                        "#f2cec2", // Protein
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    title: {
                      display: false,
                    },
                  },
                }}
              />
            </div>

            {/* Doughnut Chart: Nutritional Overview */}
            <div className="chart-card">
              <h2 className="chart-title">Nutritional Overview</h2>
              <Doughnut
                data={{
                  labels: Object.keys(nutritionSummary),
                  datasets: [
                    {
                      label: "Nutritional Values",
                      data: Object.values(nutritionSummary),
                      backgroundColor: [
                        "#ffc98b", // Fat
                        "#e79796", // Protein
                        "#f5cec7", // Calories
                        "#b6dce7", // Carbohydrate
                        "#a5cf8c", // Green
                        "#faae83", // Orange
                      ],
                    },
                  ],
                }}
                options={{
                  plugins: {
                    title: {
                      display: false,
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Table: Expiring Items */}
          <div className="table-card">
            <h2>Expiring Ingredients</h2>
            <table className="expiring-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiringItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ingredients.name}</td>
                    <td>
                      {item.days_left >= 0
                        ? `${item.days_left} days left`
                        : `Already expired for ${Math.abs(item.days_left)} days`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
