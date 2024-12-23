import { useEffect, useState } from "react";
import supabase from "../../../config/supabaseClient";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [adminUser, setAdminUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdminUser = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error("Error fetching admin user:", error.message);
                navigate("/login"); // Redirect if no session
            } else {
                const user = data?.session?.user || null;

                // Hardcoded role for now
                const userRole = "admin";

                // const userRole = user?.user_metadata?.role;
                // // console.log("User role:", userRole);    // Undefined for now since we haven't set the role yet

                if (userRole !== "admin") {
                    console.warn("Access denied: User is not an admin.");
                    navigate("/"); // Redirect non-admin users
                } else {
                    setAdminUser(user);
                }
            }
        };
        fetchAdminUser();
    }, [navigate]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign-out error:", error.message);
        } else {
            navigate("/login");
        }
    };

    return (
        <div>
            <h1>Admin Dashboard</h1>
            {adminUser && <p>Welcome, Admin {adminUser.email}</p>}
            <button onClick={handleSignOut}>Sign Out</button>

            {/* Add admin-specific sections here */}
            <div style={{ marginTop: "20px" }}>
                <h2>Admin Controls</h2>
                <ul>
                    <li>Manage Users</li>
                    <li>View Reports</li>
                    <li>Update Settings</li>
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;
