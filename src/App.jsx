import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
// import Login from './components/Login';
import Login from './containers/Authentication/Login/index';
import Signup from './containers/Authentication/Registration';

import supabase from './config/supabaseClient';
import ProtectedRoute from './components/ProtectedRoute';

// Client Components
import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
import Dashboard from './containers/Client/Dashboard';
import Inventory from './containers/Client/Inventory/index.jsx';

// Notification Component
import Notification from './containers/Client/Notification';

import Scan from './containers/Client/Scan';
// import Recipe from './containers/Client/Recipe';
import RecipeNavigation from './containers/Client/Recipe/RecipeNavigation';
import Profile from './containers/Client/Profile';

// Admin Components
import AdminLayout from './components/AdminLayout';
import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';
import AdminDashboard from './containers/Admin/Admin_Dashboard';


const App = () => {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

    // Service Worker Update Prompt
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (window.confirm("New version available. Refresh to update?")) {
          window.location.reload();
        }
      });
    }
  }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            console.log(userData);
    //         const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    //         if (userData?.user) {
    //             // Check for user role in metadata
                
                // Hardcoded role for now
                // const role = "admin";   // Uncomment this line to test admin dashboard
                   const role = "client"; // Uncomment this line to test client dashboard

    //             // Following comment is for future reference when done with authentication to differentiate between client and admin
    //             // const role = data.user.user_metadata?.role || "client"; // Default to "client"
    //             setUserRole(role);
    //             console.log("User role:", role);
    //         } else {
    //             setUserRole(null); // Not logged in

    //             console.error("No session found:", userError);
    //         }
    //         setLoading(false);

    //         if (sessionData?.session) {
    //             const role = sessionData.session.user.user_metadata?.role || "client"; // Adjust based on your metadata
    //             setUserRole(role);
    //             console.log("User role:", role);
    //         } else {
    //             setUserRole(null);
    //             console.error("No session found:", sessionError);
    //         }
        };

        fetchUser();
    }, []);

    useEffect(() => {
         // Temporarily hardcode the userRole for development
        setUserRole("client"); // or "admin" depending on the role you want to test
        // setUserRole("admin"); // or "admin" depending on the role you want to test
        setLoading(false); // Stop the loading spinner
    }, []);
    

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsCollapsed(true); // Collapse sidebar for mobile
            } else {
                setIsCollapsed(false); // Expand sidebar for larger screens
            }
        };

        // Run the check on initial load
        handleResize();

        // Add a resize event listener
        window.addEventListener("resize", handleResize);

        // Cleanup listener on component unmount
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    if (loading) {
        return <div>Loading...</div>; // Add a spinner or skeleton loader here in the future
    }

    return (
        <div className={`App ${userRole === "admin" ? (isCollapsed ? "sidebar-collapsed" : "sidebar-expanded") : ""}`}>
            {/* Conditional Navigation Rendering */}
            {userRole === "client" ? (
                <>
                    <HorizontalNavbar />
                    <div className="stickyBottom">
                        <BottomNavBar />
                    </div>
                </>
            ) : userRole === "admin" ? (
                <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            ) : null}

            {/* Main Content */}
            <main className={userRole === "admin" ? "admin-main-content" : ""}>
                <Routes>
                    {/* Default Route */}
                    <Route
                        path="/"
                        element={
                            userRole ? (
                                userRole === "admin" ? (
                                    <Navigate to="/admin/dashboard" />
                                ) : (
                                    <Navigate to="/dashboard" />
                                )
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* Authentication Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Client Routes */}
                    {userRole === "client" && (
                        <>
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/inventory"
                                element={
                                    <ProtectedRoute>
                                        <Inventory />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/scan"
                                element={
                                    <ProtectedRoute>
                                        <Scan />
                                    </ProtectedRoute>
                                }
                            />
                            {/* <Route
                                path="/recipe"
                                element={
                                    <ProtectedRoute>
                                        <Recipe />
                                    </ProtectedRoute>
                                }
                            /> */}
                            <Route
                                path="/recipes/*"
                                element={
                                    <ProtectedRoute>
                                        <RecipeNavigation />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                        </>
                    )}

                    {/* Admin Routes */}
                    {userRole === "admin" && (
                        <>
                            <Route
                                path="/admin/dashboard"
                                element={
                                    // <ProtectedRoute>
                                    //     <AdminDashboard />
                                    // </ProtectedRoute>
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminDashboard />
                                    </AdminLayout>
                                }
                            />
                            {/* Add more admin-specific routes here */}
                        </>
                    )}

                    {/* Fallback for unmatched routes */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
};

export default App;