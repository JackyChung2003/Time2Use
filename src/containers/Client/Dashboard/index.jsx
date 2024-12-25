import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, registerables } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import "./index.css";

// Register all Chart.js components
ChartJS.register(...registerables);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [ingredientData, setIngredientData] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
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
        // Fetch inventory data with explicit joins
        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory")
          .select(
            `
            ingredient_id,
            ingredients(
              name,
              ingredients_category(
                category_name
              )
            )
          `
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
    
        // Fetch expiring items
        if (user?.id) {
          const { data: expiring, error: expiringError } = await supabase
            .from("inventory")
            .select(
              `
              days_left,
              ingredients(name)
            `
            )
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
  
  

  // Handle user sign-out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error.message);
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>

      <div className="chart-container">
        {/* Donut Chart: Total Ingredients per Category */}
        <div className="chart-card">
          <Doughnut
            data={{
              labels: ingredientData.map((item) => item.category_name || "Unknown"),
              datasets: [
                {
                  label: "Ingredients",
                  data: ingredientData.map((item) => item.total || 0),
                  backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#FF5722"],
                },
              ],
            }}
            options={{
              plugins: {
                title: {
                  text: "Total Ingredients by Category",
                  display: true,
                },
              },
            }}
          />
        </div>

        {/* Table: Expiring Items */}
        {user && (
          <div className="table-card">
            <h2>Expiring Items</h2>
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
