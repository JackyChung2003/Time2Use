import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import Login from './containers/Authentication/Login/index';
import Signup from './containers/Authentication/Registration';
// import supabase from './config/supabaseClient';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Client Components
import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
import Dashboard from './containers/Client/Dashboard';
import Inventory from './containers/Client/Inventory/index.jsx';
import Notification from './containers/Client/Notification';
import Scan from './containers/Client/Scan';
import RecipeNavigation from './containers/Client/Recipe/RecipeNavigation';
import Profile from './containers/Client/Profile';

// Admin Components
import AdminLayout from './components/AdminLayout';
import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';
import AdminDashboard from './containers/Admin/Admin_Dashboard';
import AdminRecipeNavigation from './containers/Admin/Admin_Recipe/AdminRecipeNavigation';

const App = () => {
    const { userRole } = useAuth();
    console.log(userRole);
    const [loading, setLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    if (loading) {
        return <div>Loading...</div>;
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
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                            <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
                            <Route path="/recipes/*" element={<ProtectedRoute><RecipeNavigation /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        </>
                    )}

                    {/* Admin Routes */}
                    {userRole === "admin" && (
                        <>
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminDashboard />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/recipe-management/*"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminRecipeNavigation />
                                    </AdminLayout>
                                }
                            />
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
