import './index.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { role: 'client' }, // Set role as 'client' in user_metadata
                },
            });

            if (error) throw error;

            alert('Account created! Please verify your email.');
            navigate('/login');
        } catch (error) {
            console.error('Signup failed:', error.message);
            alert(`Signup failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h1 className="signup-header">Sign Up</h1>
            <form onSubmit={handleSignup}>
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
                <button type="submit" className="signup-button" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <p>
                Already have an account?{' '}
                <button className="login-link" onClick={() => navigate('/login')}>
                    Log in here
                </button>
            </p>
        </div>
    );
};

export default Signup;
