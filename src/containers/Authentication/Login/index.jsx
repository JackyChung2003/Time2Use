
// Successful directed to page
import './index.css'; // Import the CSS file
import { useState } from 'react';
import supabase from '../../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Authenticate the user
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            const userId = authData.user.id; // Logged-in user's ID
            console.log("Authenticated User ID:", userId); // Debug log

            // Fetch user role information from `user_roles` table
            const { data: userRoleData, error: userRoleError } = await supabase
                .from('user_roles')
                .select('role_id, user_id')
                .eq('user_id', userId)
                .single(); // Assumes each user has exactly one role

            if (userRoleError) throw new Error(userRoleError.message);

            const { role_id: roleId } = userRoleData;
            console.log("Fetched Role ID:", roleId); // Debug log

            // Fetch the role name from the `roles` table using the role_id
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('role_name')
                .eq('id', roleId)
                .single();

            if (roleError) throw new Error(roleError.message);

            // Normalize role name (trim spaces and lowercase for comparison)
            const roleName = roleData.role_name.trim().toLowerCase();
            console.log("Fetched Role Name:", roleName); // Debug log

            // Navigate to the appropriate dashboard based on role
            if (roleName === 'admin') {
                navigate('/admin/dashboard');
            } else if (roleName === 'client') {
                navigate('/dashboard');
            } else {
                throw new Error('Unknown role detected.');
            }
        } catch (error) {
            console.error('Login failed:', error.message);
            alert(`Login failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="header">Login</h1>
            <form onSubmit={handleEmailLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="login-button" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p className="footer">
                Don't have an account?{' '}
                <button className="signup-link" onClick={() => navigate('/signup')}>
                    Sign Up
                </button>
            </p>
        </div>
    );
};

export default Login;




// import './index.css'; // Import the CSS file
// import { useState } from 'react';
// import supabase from '../../../config/supabaseClient';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleEmailLogin = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//             if (error) throw error;

//             alert(`Welcome back, ${data.user.email}`);

//             // Fetch the user's role after successful login
//             const { data: userRoles, error: userRolesError } = await supabase
//                 .from('user_roles')
//                 .select('role_id')
//                 .eq('user_id', data.user.id)
//                 .single();

//             if (userRolesError) {
//                 console.error("Error fetching user role:", userRolesError.message);
//                 navigate('/login');
//                 return;
//             }

//             const roleId = userRoles?.role_id;

//             // Fetch the role name from the 'roles' table
//             const { data: roleData, error: roleError } = await supabase
//                 .from('roles')
//                 .select('role_name')
//                 .eq('id', roleId)
//                 .single();

//             if (roleError) {
//                 console.error("Error fetching role name:", roleError.message);
//                 navigate('/login');
//                 return;
//             }

//             const role = roleData?.role_name || 'client'; // Default to 'client' if no role is found

//             // Navigate to the appropriate dashboard based on the user's role
//             if (role === 'admin') {
//                 navigate('/admin/dashboard');
//             } else {
//                 navigate('/dashboard');
//             }

//         } catch (error) {
//             console.error('Login failed:', error.message);
//             alert(`Login failed: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="container">
//             <h1 className="header">Login</h1>
//             <form onSubmit={handleEmailLogin}>
//                 <input
//                     type="email"
//                     placeholder="Email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                 />
//                 <button type="submit" className="login-button" disabled={loading}>
//                     {loading ? 'Logging in...' : 'Login'}
//                 </button>
//             </form>
//             <p className="footer">
//                 Don't have an account?{' '}
//                 <button className="signup-link" onClick={() => navigate('/signup')}>
//                     Sign Up
//                 </button>
//             </p>
//         </div>
//     );
// };

// export default Login;




// import './index.css'; // Import the CSS file
// import { useState } from 'react';
// import supabase from '../../../config/supabaseClient';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleEmailLogin = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//             if (error) throw error;

//             alert(`Welcome back, ${data.user.email}`);
//             navigate('/dashboard');
//         } catch (error) {
//             console.error('Login failed:', error.message);
//             alert(`Login failed: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="container">
//             <h1 className="header">Login</h1>
//             <form onSubmit={handleEmailLogin}>
//                 <input
//                     type="email"
//                     placeholder="Email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                 />
//                 <button type="submit" className="login-button" disabled={loading}>
//                     {loading ? 'Logging in...' : 'Login'}
//                 </button>
//             </form>
//             <p className="footer">
//                 Dont have an account?{' '}
//                 <button className="signup-link" onClick={() => navigate('/signup')}>
//                     Sign Up
//                 </button>
//             </p>
//         </div>
//     );
// };

// export default Login;