// Successful directed page
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from './config/supabaseClient';

// Authentication Components
import Login from './containers/Authentication/Login';
import Signup from './containers/Authentication/Registration';

// Client Components
import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
import Dashboard from './containers/Client/Dashboard';
import Inventory from './containers/Client/Inventory';
import Scan from './containers/Client/Scan';
import Recipe from './containers/Client/Recipe';
import Profile from './containers/Client/Profile';

// Admin Components
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './containers/Admin/Admin_Dashboard';
import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';

// Shared Components
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const fetchUserRole = async () => {
            setLoading(true);
            const { data: authUser, error: authError } = await supabase.auth.getUser();

            if (authUser?.user) {
                try {
                    // Fetch user role from public.user_roles and public.roles tables
                    const { data: userRoleData, error: userRoleError } = await supabase
                        .from('user_roles')
                        .select('role_id')
                        .eq('user_id', authUser.user.id)
                        .single();

                    if (userRoleError) throw new Error(userRoleError.message);

                    const { data: roleData, error: roleError } = await supabase
                        .from('roles')
                        .select('role_name')
                        .eq('id', userRoleData?.role_id)
                        .single();

                    if (roleError) throw new Error(roleError.message);

                    // Normalize the role name
                    const normalizedRoleName = roleData?.role_name.trim().toLowerCase();
                    console.log("Fetched Role Name:", normalizedRoleName);

                    setUserRole(normalizedRoleName || 'client');
                } catch (error) {
                    console.error('Error fetching user role:', error.message);
                    setUserRole('client'); // Default to client role if errors occur
                }
            } else {
                setUserRole(null); // Not logged in
            }
            setLoading(false);
        };

        fetchUserRole();
    }, []);

    const toggleSidebar = () => setIsCollapsed((prev) => !prev);

    if (loading) {
        return <div>Loading...</div>; // Add a spinner or skeleton loader here
    }

    return (
        <div className={`App ${userRole === 'admin' ? (isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded') : ''}`}>
            {/* Conditional Navigation */}
            {userRole === 'client' ? (
                <>
                    <HorizontalNavbar />
                    <BottomNavBar className="stickyBottom" />
                </>
            ) : userRole === 'admin' ? (
                <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
            ) : null}

            {/* Main Content */}
            <main className={userRole === 'admin' ? 'admin-main-content' : ''}>
                <Routes>
                    {/* Default Route */}
                    <Route
                        path="/"
                        element={
                            userRole === 'admin' ? (
                                <Navigate to="/admin/dashboard" />
                            ) : userRole === 'client' ? (
                                <Navigate to="/dashboard" />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    {/* Authentication Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Client Routes */}
                    {userRole === 'client' && (
                        <>
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                            <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
                            <Route path="/recipe" element={<ProtectedRoute><Recipe /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        </>
                    )}

                    {/* Admin Routes */}
                    {userRole === 'admin' && (
                        <>
                            <Route
                                path="/admin/dashboard"
                                element={
                                    <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
                                        <AdminDashboard />
                                    </AdminLayout>
                                }
                            />
                            {/* Add additional admin routes here */}
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




//failed code (metadata)
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import supabase from './config/supabaseClient';

// // Authentication Components
// import Login from './containers/Authentication/Login';
// import Signup from './containers/Authentication/Registration';

// // Client Components
// import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
// import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
// import Dashboard from './containers/Client/Dashboard';
// import Inventory from './containers/Client/Inventory';
// import Scan from './containers/Client/Scan';
// import Recipe from './containers/Client/Recipe';
// import Profile from './containers/Client/Profile';

// // Admin Components
// import AdminLayout from './components/AdminLayout';
// import AdminDashboard from './containers/Admin/Admin_Dashboard';
// import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';

// // Shared Components
// import ProtectedRoute from './components/ProtectedRoute';

// const App = () => {
//     const [userRole, setUserRole] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [isCollapsed, setIsCollapsed] = useState(false);

//     useEffect(() => {
//         const fetchUserRole = async () => {
//             setLoading(true);
//             const { data: authUser, error: authError } = await supabase.auth.getUser();

//             if (authUser?.user) {
//                 try {
//                     // Fetch user role from user_metadata
//                     const userRole = authUser.user.user_metadata?.role || 'client'; // Default to 'client'

//                     setUserRole(userRole);
//                 } catch (error) {
//                     console.error('Error fetching user role:', error.message);
//                     setUserRole('client'); // Default to 'client' role in case of error
//                 }
//             } else {
//                 setUserRole(null); // Not logged in
//             }
//             setLoading(false);
//         };

//         fetchUserRole();
//     }, []);

//     const toggleSidebar = () => setIsCollapsed((prev) => !prev);

//     if (loading) {
//         return <div>Loading...</div>; // Add a spinner or skeleton loader here
//     }

//     return (
//         <div className={`App ${userRole === 'admin' ? (isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded') : ''}`}>
//             {/* Conditional Navigation */}
//             {userRole === 'client' ? (
//                 <>
//                     <HorizontalNavbar />
//                     <BottomNavBar className="stickyBottom" />
//                 </>
//             ) : userRole === 'admin' ? (
//                 <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
//             ) : null}

//             {/* Main Content */}
//             <main className={userRole === 'admin' ? 'admin-main-content' : ''}>
//                 <Routes>
//                     {/* Default Route */}
//                     <Route
//                         path="/"
//                         element={
//                             userRole === 'admin' ? (
//                                 <Navigate to="/admin/dashboard" />
//                             ) : userRole === 'client' ? (
//                                 <Navigate to="/dashboard" />
//                             ) : (
//                                 <Navigate to="/login" />
//                             )
//                         }
//                     />

//                     {/* Authentication Routes */}
//                     <Route path="/login" element={<Login />} />
//                     <Route path="/signup" element={<Signup />} />

//                     {/* Client Routes */}
//                     {userRole === 'client' && (
//                         <>
//                             <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//                             <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
//                             <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
//                             <Route path="/recipe" element={<ProtectedRoute><Recipe /></ProtectedRoute>} />
//                             <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
//                         </>
//                     )}

//                     {/* Admin Routes */}
//                     {userRole === 'admin' && (
//                         <>
//                             <Route
//                                 path="/admin/dashboard"
//                                 element={
//                                     <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
//                                         <AdminDashboard />
//                                     </AdminLayout>
//                                 }
//                             />
//                             {/* Add additional admin routes here */}
//                         </>
//                     )}

//                     {/* Fallback for unmatched routes */}
//                     <Route path="*" element={<Navigate to="/" />} />
//                 </Routes>
//             </main>
//         </div>
//     );
// };

// export default App;


//cleaner code of 2.0
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import supabase from './config/supabaseClient';

// // Authentication Components
// import Login from './containers/Authentication/Login';
// import Signup from './containers/Authentication/Registration';

// // Client Components
// import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
// import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
// import Dashboard from './containers/Client/Dashboard';
// import Inventory from './containers/Client/Inventory';
// import Scan from './containers/Client/Scan';
// import Recipe from './containers/Client/Recipe';
// import Profile from './containers/Client/Profile';

// // Admin Components
// import AdminLayout from './components/AdminLayout';
// import AdminDashboard from './containers/Admin/Admin_Dashboard';
// import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';

// // Shared Components
// import ProtectedRoute from './components/ProtectedRoute';

// const App = () => {
//     const [userRole, setUserRole] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [isCollapsed, setIsCollapsed] = useState(false);

//     useEffect(() => {
//         const fetchUserRole = async () => {
//             setLoading(true);
//             const { data: authUser, error: authError } = await supabase.auth.getUser();

//             if (authUser?.user) {
//                 try {
//                     // Fetch user role from public.user_roles and public.roles tables
//                     const { data: userRoleData, error: userRoleError } = await supabase
//                         .from('user_roles')
//                         .select('role_id')
//                         .eq('user_id', authUser.user.id)
//                         .single();

//                     if (userRoleError) throw new Error(userRoleError.message);

//                     const { data: roleData, error: roleError } = await supabase
//                         .from('roles')
//                         .select('role_name')
//                         .eq('id', userRoleData?.role_id)
//                         .single();

//                     if (roleError) throw new Error(roleError.message);

//                     setUserRole(roleData?.role_name || 'client');
//                 } catch (error) {
//                     console.error('Error fetching user role:', error.message);
//                     setUserRole('client'); // Default to client role if errors occur
//                 }
//             } else {
//                 setUserRole(null); // Not logged in
//             }
//             setLoading(false);
//         };

//         fetchUserRole();
//     }, []);

//     const toggleSidebar = () => setIsCollapsed((prev) => !prev);

//     if (loading) {
//         return <div>Loading...</div>; // Add a spinner or skeleton loader here
//     }

//     return (
//         <div className={`App ${userRole === 'admin' ? (isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded') : ''}`}>
//             {/* Conditional Navigation */}
//             {userRole === 'client' ? (
//                 <>
//                     <HorizontalNavbar />
//                     <BottomNavBar className="stickyBottom" />
//                 </>
//             ) : userRole === 'admin' ? (
//                 <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
//             ) : null}

//             {/* Main Content */}
//             <main className={userRole === 'admin' ? 'admin-main-content' : ''}>
//                 <Routes>
//                     {/* Default Route */}
//                     <Route
//                         path="/"
//                         element={
//                             userRole === 'admin' ? (
//                                 <Navigate to="/admin/dashboard" />
//                             ) : userRole === 'client' ? (
//                                 <Navigate to="/dashboard" />
//                             ) : (
//                                 <Navigate to="/login" />
//                             )
//                         }
//                     />

//                     {/* Authentication Routes */}
//                     <Route path="/login" element={<Login />} />
//                     <Route path="/signup" element={<Signup />} />

//                     {/* Client Routes */}
//                     {userRole === 'client' && (
//                         <>
//                             <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//                             <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
//                             <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
//                             <Route path="/recipe" element={<ProtectedRoute><Recipe /></ProtectedRoute>} />
//                             <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
//                         </>
//                     )}

//                     {/* Admin Routes */}
//                     {userRole === 'admin' && (
//                         <>
//                             <Route
//                                 path="/admin/dashboard"
//                                 element={
//                                     <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
//                                         <AdminDashboard />
//                                     </AdminLayout>
//                                 }
//                             />
//                             {/* Add additional admin routes here */}
//                         </>
//                     )}

//                     {/* Fallback for unmatched routes */}
//                     <Route path="*" element={<Navigate to="/" />} />
//                 </Routes>
//             </main>
//         </div>
//     );
// };

// export default App;



// 2.0 can use code but fail auth
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from "react";
// import Login from './containers/Authentication/Login/index';
// import Signup from './containers/Authentication/Registration';
// import supabase from './config/supabaseClient';
// import ProtectedRoute from './components/ProtectedRoute';

// // Client Components
// import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
// import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
// import Dashboard from './containers/Client/Dashboard';
// import Inventory from './containers/Client/Inventory';
// import Scan from './containers/Client/Scan';
// import Recipe from './containers/Client/Recipe';
// import Profile from './containers/Client/Profile';

// // Admin Components
// import AdminLayout from './components/AdminLayout';
// import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';
// import AdminDashboard from './containers/Admin/Admin_Dashboard';

// const App = () => {
//     const [userRole, setUserRole] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

//     useEffect(() => {
//         const fetchUser = async () => {
//             const { data, error } = await supabase.auth.getUser();

//             if (data?.user) {
//                 // Fetch the user's role from the user_roles table
//                 const { data: userRoles, error: userRolesError } = await supabase
//                     .from('user_roles')
//                     .select('roles_id')
//                     .eq('user_id', data.user.id)
//                     .single();

//                 if (userRolesError) {
//                     console.error("Error fetching user role:", userRolesError.message);
//                     setUserRole(null);
//                     setLoading(false);
//                     return;
//                 }

//                 const roleId = userRoles?.roles_id;

//                 // Fetch the role name from the roles table
//                 const { data: roleData, error: roleError } = await supabase
//                     .from('roles')
//                     .select('role_name')
//                     .eq('id', roleId)
//                     .single();

//                 if (roleError) {
//                     console.error("Error fetching role name:", roleError.message);
//                     setUserRole('client'); // Default to 'client' in case of error
//                 } else {
//                     setUserRole(roleData?.role_name || 'client'); // Set the role to 'client' if no role is found
//                 }
//             } else {
//                 setUserRole(null); // User is not logged in
//             }
//             setLoading(false);
//         };

//         fetchUser();
//     }, []);

//     const toggleSidebar = () => {
//         setIsCollapsed(!isCollapsed);
//     };

//     if (loading) {
//         return <div>Loading...</div>; // Add a spinner or skeleton loader here
//     }

//     return (
//         <div className={`App ${userRole === "admin" ? (isCollapsed ? "sidebar-collapsed" : "sidebar-expanded") : ""}`}>
//             {/* Conditional Navigation Rendering */}
//             {userRole === "client" ? (
//                 <>
//                     <HorizontalNavbar />
//                     <div className="stickyBottom">
//                         <BottomNavBar />
//                     </div>
//                 </>
//             ) : userRole === "admin" ? (
//                 <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
//             ) : null}

//             {/* Main Content */}
//             <main className={userRole === "admin" ? "admin-main-content" : ""}>
//                 <Routes>
//                     {/* Default Route */}
//                     <Route
//                         path="/"
//                         element={
//                             userRole ? (
//                                 userRole === "admin" ? (
//                                     <Navigate to="/admin/dashboard" />
//                                 ) : (
//                                     <Navigate to="/dashboard" />
//                                 )
//                             ) : (
//                                 <Navigate to="/login" />
//                             )
//                         }
//                     />

//                     {/* Authentication Routes */}
//                     <Route path="/login" element={<Login />} />
//                     <Route path="/signup" element={<Signup />} />

//                     {/* Client Routes */}
//                     {userRole === "client" && (
//                         <>
//                             <Route
//                                 path="/dashboard"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Dashboard />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/inventory"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Inventory />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/scan"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Scan />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/recipe"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Recipe />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/profile"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Profile />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                         </>
//                     )}

//                     {/* Admin Routes */}
//                     {userRole === "admin" && (
//                         <>
//                             <Route
//                                 path="/admin/admin_dashboard"
//                                 element={
//                                     <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
//                                         <AdminDashboard />
//                                     </AdminLayout>
//                                 }
//                             />
//                             {/* Add more admin-specific routes here */}
//                         </>
//                     )}

//                     {/* Fallback for unmatched routes */}
//                     <Route path="*" element={<Navigate to="/" />} />
//                 </Routes>
//             </main>
//         </div>
//     );
// };

// export default App;








//original code
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useEffect, useState } from "react";
// // import Login from './components/Login';
// import Login from './containers/Authentication/Login/index';
// import Signup from './containers/Authentication/Registration';

// import supabase from './config/supabaseClient';
// import ProtectedRoute from './components/ProtectedRoute';

// // Client Components
// import HorizontalNavbar from './containers/Client/Navigation/HorizontalNavBar';
// import BottomNavBar from './containers/Client/Navigation/BottomNavBar';
// import Dashboard from './containers/Client/Dashboard';
// import Inventory from './containers/Client/Inventory';
// import Scan from './containers/Client/Scan';
// import Recipe from './containers/Client/Recipe';
// import Profile from './containers/Client/Profile';

// // Admin Components
// import AdminLayout from './components/AdminLayout';
// import SideNavBar from './containers/Admin/Admin_Navigation/SideNavBar';
// import AdminDashboard from './containers/Admin/Admin_Dashboard';


// const App = () => {
//     const [userRole, setUserRole] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state

//     useEffect(() => {
//         const fetchUser = async () => {
//             const { data, error } = await supabase.auth.getUser();

//             if (data?.user) {
//                 // Check for user role in metadata
                
//                 // Hardcoded role for now
//                 const role = "admin";   // Uncomment this line to test admin dashboard
//                 // const role = "client"; // Uncomment this line to test client dashboard

//                 // Following comment is for future reference when done with authentication to differentiate between client and admin
//                 // const role = data.user.user_metadata?.role || "client"; // Default to "client"
//                 setUserRole(role);
//                 console.log("User role:", role);
//             } else {
//                 setUserRole(null); // Not logged in
//             }
//             setLoading(false);
//         };

//         fetchUser();
//     }, []);


//     useEffect(() => {
//         const handleResize = () => {
//             if (window.innerWidth <= 768) {
//                 setIsCollapsed(true); // Collapse sidebar for mobile
//             } else {
//                 setIsCollapsed(false); // Expand sidebar for larger screens
//             }
//         };

//         // Run the check on initial load
//         handleResize();

//         // Add a resize event listener
//         window.addEventListener("resize", handleResize);

//         // Cleanup listener on component unmount
//         return () => window.removeEventListener("resize", handleResize);
//     }, []);

//     const toggleSidebar = () => {
//         setIsCollapsed(!isCollapsed);
//     };

//     if (loading) {
//         return <div>Loading...</div>; // Add a spinner or skeleton loader here in the future
//     }

//     return (
//         <div className={`App ${userRole === "admin" ? (isCollapsed ? "sidebar-collapsed" : "sidebar-expanded") : ""}`}>
//             {/* Conditional Navigation Rendering */}
//             {userRole === "client" ? (
//                 <>
//                     <HorizontalNavbar />
//                     <div className="stickyBottom">
//                         <BottomNavBar />
//                     </div>
//                 </>
//             ) : userRole === "admin" ? (
//                 <SideNavBar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
//             ) : null}

//             {/* Main Content */}
//             <main className={userRole === "admin" ? "admin-main-content" : ""}>
//                 <Routes>
//                     {/* Default Route */}
//                     <Route
//                         path="/"
//                         element={
//                             userRole ? (
//                                 userRole === "admin" ? (
//                                     <Navigate to="/admin/dashboard" />
//                                 ) : (
//                                     <Navigate to="/dashboard" />
//                                 )
//                             ) : (
//                                 <Navigate to="/login" />
//                             )
//                         }
//                     />

//                     {/* Authentication Routes */}
//                     <Route path="/login" element={<Login />} />
//                     <Route path="/signup" element={<Signup />} />

//                     {/* Client Routes */}
//                     {userRole === "client" && (
//                         <>
//                             <Route
//                                 path="/dashboard"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Dashboard />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/inventory"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Inventory />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/scan"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Scan />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/recipe"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Recipe />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                             <Route
//                                 path="/profile"
//                                 element={
//                                     <ProtectedRoute>
//                                         <Profile />
//                                     </ProtectedRoute>
//                                 }
//                             />
//                         </>
//                     )}

//                     {/* Admin Routes */}
//                     {userRole === "admin" && (
//                         <>
//                             <Route
//                                 path="/admin/dashboard"
//                                 element={
//                                     // <ProtectedRoute>
//                                     //     <AdminDashboard />
//                                     // </ProtectedRoute>
//                                     <AdminLayout isCollapsed={isCollapsed} toggleSidebar={toggleSidebar}>
//                                         <AdminDashboard />
//                                     </AdminLayout>
//                                 }
//                             />
//                             {/* Add more admin-specific routes here */}
//                         </>
//                     )}

//                     {/* Fallback for unmatched routes */}
//                     <Route path="*" element={<Navigate to="/" />} />
//                 </Routes>
//             </main>
//         </div>
//     );
// };

// export default App;
