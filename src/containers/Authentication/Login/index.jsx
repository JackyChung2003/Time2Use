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
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                // Handle specific Supabase auth errors
                if (error.status === 400) {
                    alert('Incorrect email or password. Please try again.');
                } else if (error.status === 404) {
                    alert('No user found with this email. Please create an account.');
                } else {
                    alert(`Login failed: ${error.message}`);
                }
                throw error;
            }

            alert('Login successful!');

            // Fetch role_id from user_roles
            const { data: userRoleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role_id')
                .eq('user_id', data.user.id)
                .single();

            if (roleError) {
                console.error('Error fetching user_role:', roleError);
                throw roleError;
            }

            // Fetch role_name from roles table using role_id
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

            // Update role in context
            updateUserRole(roleName);

            // Check the user's profile for a username (only for clients)
            if (roleName === 'client') {
                const { data: profileData, error: profileError } = await supabase
                    .from('profile') // Assuming user profile information is stored here
                    .select('username')
                    .eq('user', data.user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching profile data:', profileError);
                    throw profileError;
                }

                // If the username is empty, navigate to the profile page to set it
                if (!profileData?.username) {
                    navigate('/profile');
                } else {
                    navigate('/dashboard'); // Navigate to the client dashboard
                }
            } else if (roleName === 'admin') {
                navigate('/admin/dashboard'); // Navigate to the admin dashboard
            } else {
                throw new Error(`Unknown role: ${roleName}`);
            }

        } catch (error) {
            console.error('Error:', error.message);
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
                {/* Forgot Password Link */}
                <p className="forgot-password-link">
                    <button 
                        type="button" 
                        className="forgot-password-button" 
                        onClick={() => navigate('/forgetpassword')}
                    >
                        Forgot Password?
                    </button>
                </p>
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
