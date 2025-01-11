// Successful directed to page
import './index.css'; // Import the CSS file
import { useState } from 'react';
import supabase from '../../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { updateUserRole } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // First get the role_id from user_roles
            const { data: userRoleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role_id')
                .eq('user_id', data.user.id)
                .single();

            if (roleError) {
                console.error('Error fetching user_role:', roleError);
                throw roleError;
            }

            // Then get the role_name from roles table using role_id
            const { data: roleData, error: roleNameError } = await supabase
                .from('roles')
                .select('role_name')
                .eq('id', userRoleData.role_id)
                .single();

            if (roleNameError) {
                console.error('Error fetching role_name:', roleNameError);
                throw roleNameError;
            }

            const roleName = roleData.role_name.trim().toLowerCase();
            console.log('Role before storing:', roleName);
            
            // Set notification flag to true for dashboard
            sessionStorage.setItem('showNotification', 'true');

            // Update role in context (this also stores in localStorage)
            updateUserRole(roleName);
            console.log('Role after storing:', roleName);

            // Navigate based on role
            if (roleName === 'admin') {
                console.log("Navigating to admin dashboard");
                navigate('/admin/dashboard');
            } else if (roleName === 'client') {
                console.log("Navigating to user dashboard");
                navigate('/dashboard');
            } else {
                throw new Error(`Unknown role: ${roleName}`);
            }

        } catch (error) {
            console.error('Error:', error.message);
            setError(error.message);
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
