import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import Login from './containers/Authentication/Login/index';
import ForgetPassword from './containers/Authentication/ForgetPassword/index';
import Signup from './containers/Authentication/Registration';
//import supabase from './config/supabaseClient';
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
import AdminUsers from './containers/Admin/Admin_Users';
import CreateUser from './containers/Admin/Admin_Users/CreateUser';
import ViewUser from './containers/Admin/Admin_Users/ViewUser';
import EditUser from './containers/Admin/Admin_Users/EditUser';
import AdminInventories from './containers/Admin/Admin_Inventory/index.jsx';
import CreateInventory from './containers/Admin/Admin_Inventory/CreateInventory';
import ViewInventory from './containers/Admin/Admin_Inventory/ViewInventory';
import EditInventory from './containers/Admin/Admin_Inventory/EditInventory';
import AdminIngredients from './containers/Admin/Admin_Ingredients/index.jsx';
import CreateIngredient from './containers/Admin/Admin_Ingredients/CreateIngredient';
import ViewIngredient from './containers/Admin/Admin_Ingredients/ViewIngredient';
import EditIngredient from './containers/Admin/Admin_Ingredients/EditIngredient';

import AdminUnit from './containers/Admin/Admin_Units/index.jsx';
import CreateUnit from './containers/Admin/Admin_Units/CreateUnit';
import ViewUnit from './containers/Admin/Admin_Units/ViewUnit';
import EditUnit from './containers/Admin/Admin_Units/EditUnit';

import AdminUnitInv from './containers/Admin/Admin_UnitInv/index.jsx';
import CreateUnitInv from './containers/Admin/Admin_UnitInv/CreateUnitInv';
import ViewUnitInv from './containers/Admin/Admin_UnitInv/ViewUnitInv';
import EditUnitInv from './containers/Admin/Admin_UnitInv/EditUnitInv';

import AdminIngredientsCat from './containers/Admin/Admin_IngredientsCat/index.jsx';
import CreateIngredientsCat from './containers/Admin/Admin_IngredientsCat/CreateIngredientsCat';
import ViewIngredientsCat from './containers/Admin/Admin_IngredientsCat/ViewIngredientsCat';
import EditIngredientsCat from './containers/Admin/Admin_IngredientsCat/EditIngredientsCat';

const App = () => {
    const { userRole } = useAuth();
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
                    <Route path="/forgetpassword" element={<ForgetPassword />} />
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
                            <Route
                                path="/admin/users"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminUsers />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/users/create"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <CreateUser />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/users/view/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <ViewUser />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/users/edit/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <EditUser />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/inventories"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminInventories />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/inventories/create"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <CreateInventory />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/inventories/view/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <ViewInventory />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/inventories/edit/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <EditInventory />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredients"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminIngredients />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredients/create"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <CreateIngredient />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredients/view/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <ViewIngredient />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredients/edit/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <EditIngredient />
                                    </AdminLayout>
                                }
                            />

                            <Route
                                path="/admin/units"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminUnit />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/units/create"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <CreateUnit />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/units/view/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <ViewUnit />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/units/edit/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <EditUnit />
                                    </AdminLayout>
                                }
                            />

                            
                            <Route
                                path="/admin/unitinv"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminUnitInv />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/unitinv/create"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <CreateUnitInv />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/unitinv/view/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <ViewUnitInv />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/unitinv/edit/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <EditUnitInv />
                                    </AdminLayout>
                                }
                            />

                            <Route
                                path="/admin/ingredientscat"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminIngredientsCat />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredientscat/create"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <CreateIngredientsCat />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredientscat/view/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <ViewIngredientsCat />
                                    </AdminLayout>
                                }
                            />
                            <Route
                                path="/admin/ingredientscat/edit/:id"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <EditIngredientsCat />
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
