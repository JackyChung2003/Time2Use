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
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            alert(`Welcome back, ${data.user.email}`);

            // Fetch the user's role after successful login
            const { data: userRoles, error: userRolesError } = await supabase
                .from('user_roles')
                .select('role_id')
                .eq('user_id', data.user.id)
                .single();

            if (userRolesError) {
                console.error("Error fetching user role:", userRolesError.message);
                navigate('/login');
                return;
            }

            const roleId = userRoles?.role_id;

            // Fetch the role name from the 'roles' table
            const { data: roleData, error: roleError } = await supabase
                .from('roles')
                .select('role_name')
                .eq('id', roleId)
                .single();

            if (roleError) {
                console.error("Error fetching role name:", roleError.message);
                navigate('/login');
                return;
            }

            const role = roleData?.role_name || 'client'; // Default to 'client' if no role is found

            // Navigate to the appropriate dashboard based on the user's role
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
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