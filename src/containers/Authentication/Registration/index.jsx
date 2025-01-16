import './index.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../../config/supabaseClient';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Check if fields are empty
        if (!email || !password || !confirmPassword) {
            setError('Not Empty Field Allowed');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Password not matched');
            return;
        }

        // Check if password meets length requirement
        if (password.length < 6) {
            setError('Password should be >= 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Try to sign up
            const { data, error: signUpError } = await supabase.public.user_roles({
                email,
                password,
                options: {
                    data: { role: 'client' },
                },
            });

            if (signUpError) {
                if (signUpError.message?.toLowerCase().includes('duplicate')) {
                    setError('Email Already Registered');
                } else {
                    setError(signUpError.message || 'Signup failed. Please try again.');
                }
                throw signUpError; // Prevent further processing
            }

            if (data?.user) {
                console.log('Signup successful:', {
                    userId: data.user.id,
                    email: data.user.email,
                    metadata: data.user.user_metadata
                });
            }

            alert('Account created! Please verify your email.');
            navigate('/login');
        } catch (error) {
            console.error('Error during signup:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <h1 className="signup-header">Sign Up</h1>
            {error && <p className="error-message">{error}</p>}
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
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
