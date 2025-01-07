import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, registerables } from "chart.js";
import { Pie, Doughnut } from "react-chartjs-2";
import "./index.css";
import Notification from '../Notification';

// Register all Chart.js components
ChartJS.register(...registerables);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [ingredientData, setIngredientData] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
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

  // Fetch username from profile table
  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("username")
        .eq("user", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching username:", profileError.message);
      } else {
        setUsername(profileData?.username || "User");
      }
    };

    if (user) fetchUsername();
  }, [user]);

  
  // Fetch dashboard data once user is authenticated
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch inventory for category chart
        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory")
          .select(
            `ingredient_id, ingredients(name, ingredients_category(category_name))`
          )
          .eq("user_id", user.id)
          .eq("condition_id", 1);

        if (inventoryError) {
          console.error("Error fetching inventory:", inventoryError.message);
        } else {
          const groupedData = inventory.reduce((acc, item) => {
            const categoryName =
              item.ingredients?.ingredients_category?.category_name || "Unknown";
            acc[categoryName] = (acc[categoryName] || 0) + 1;
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
          .eq("user_id", user.id)
          .eq("condition_id", 1);

        if (nutritionError) {
          console.error("Error fetching nutritional info:", nutritionError.message);
        } else {
          const nutritionSummary = inventoryForNutrition.reduce((acc, item) => {
            try {
              const nutrition =
                typeof item.ingredients?.nutritional_info === "string"
                  ? JSON.parse(item.ingredients.nutritional_info)
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

        // Fetch expiring items (days_left <= 5 and > 0)
        const { data: expiring, error: expiringError } = await supabase
          .from("inventory")
          .select(`days_left, ingredients(name)`)
          .eq("user_id", user?.id)
          .eq("condition_id", 1) // Only fetch available items
          .gt("days_left", 0)
          .lte("days_left", 5);

        if (expiringError) throw expiringError;
        
        // Sort by days_left in descending order
        setExpiringItems(expiring.sort((a, b) => b.days_left - a.days_left));

        // Fetch expired items (days_left <= 0)
        const { data: expired, error: expiredError } = await supabase
          .from("inventory")
          .select(`days_left, ingredients(name)`)
          .eq("user_id", user?.id)
          .eq("condition_id", 1) // Only fetch available items
          .lte("days_left", 0);

        if (expiredError) throw expiredError;
        // Sort by days_left in descending order
        setExpiredItems(expired.sort((b, a) => b.days_left - a.days_left));
      
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

  // Check if user is new
  const isNewUser =
    ingredientData.length === 0 && expiringItems.length === 0 && expiredItems.length === 0;

  return (
    <div>
    <Notification />
    <div className="dashboard-container">
      <div className="dashboard-header">
        {username && <h1>Welcome, {username}!</h1>}
      </div>

      {isNewUser ? (
        <div className="empty-state">
          <p>
            To get started, scan a receipt to load your inventory and explore insights
            about your kitchen.
          </p>
        </div>
      ) : (
        <>
          <div className="chart-container">
            {/* Pie Chart: Inventory by Category */}
            <div className="chart-card">
              <h2>Total Ingredients in Your Inventory</h2>
              <Pie
                data={{
                  labels: ingredientData.map((item) => item.category_name),
                  datasets: [
                    {
                      data: ingredientData.map((item) => item.total),
                      backgroundColor: [
                        "#84e2ca", // Vegetables
                        "#caabd5", // Condiments
                        "#fbdd94", // Dairy
                        "#f58a78", // Meat
                        "#f2cec2", // Protein
                      ],
                    },
                  ],
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

        {/* Tables for expiring and expired items */}
        <div className="table-container">
          {/* Expiring Items Table */}
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
                    <td>{`${Math.abs(item.days_left)} days left`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expired Items Table */}
          <div className="table-card">
            <h2>Expired Ingredients</h2>
            <table className="expiring-table">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiredItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ingredients.name}</td>
                    <td>{`Expired ${Math.abs(item.days_left)} days ago`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
    </div>
  );
};

export default Dashboard;

