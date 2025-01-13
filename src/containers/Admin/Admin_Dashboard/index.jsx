import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./index.css";

const AdminDashboard = () => {
    const [adminUser, setAdminUser] = useState(null);
    const [userCount, setUserCount] = useState(0);
    const [ingredientCount, setIngredientCount] = useState(0);
    const [inventoryCount, setInventoryCount] = useState(0);
    const navigate = useNavigate();

    // Fetch admin user and dropdown data
    useEffect(() => {
        const fetchAdminUser = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching admin user:", error.message);
                navigate("/login");
            } else {
                const user = data?.session?.user || null;
                const userRole = "admin"; // Replace with dynamic role fetching
                if (userRole !== "admin") {
                    console.warn("Access denied: User is not an admin.");
                    navigate("/");
                } else {
                    setAdminUser(user);
                    fetchCounts();
                }
            }
        };

        fetchAdminUser();
    }, [navigate]);

    // Fetch total counts for users, ingredients, and inventory
    const fetchCounts = async () => {
        try {
            // Fetch total users
            const { data: users, error: userError } = await supabase
                .from("profile")
                .select("id", { count: "exact" });
            if (userError) throw userError;

            // Fetch total ingredients
            const { data: ingredients, error: ingredientError } = await supabase
                .from("ingredients")
                .select("id", { count: "exact" });
            if (ingredientError) throw ingredientError;
            const ingredientCount = ingredients.length;

            // Fetch total inventory records
            const { data: inventory, error: inventoryError } = await supabase
                .from("inventory")
                .select("id", { count: "exact" });
            if (inventoryError) throw inventoryError;

            setUserCount(users.length);
            setIngredientCount(ingredients.length);
            setInventoryCount(inventory.length);
        } catch (error) {
            console.error("Error fetching counts:", error.message);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-content">
                <h1>Admin Dashboard</h1>
                {adminUser && <p>Welcome, Admin {adminUser.email}</p>}
                <button
                    className="sign-out-btn"
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate("/login");
                    }}
                >
                    Sign Out
                </button>
            </div>

            {/* Statistics Boxes */}
            <div className="stats-container">
                <div className="stats-box">
                    <h2>Active Users</h2>
                    <p>{userCount}</p>
                </div>
                <div className="stats-box">
                    <h2>Total Number of Ingredients</h2>
                    <p>{ingredientCount}</p>
                </div>
                <div className="stats-box">
                    <h2>Total Inventory Records</h2>
                    <p>{inventoryCount}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
