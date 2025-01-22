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
            // First, try to sign up
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { role: 'client' }, // Set role as 'client' in user_metadata
                },
            });

            if (signUpError) {
                console.error('Signup error details:', {
                    message: signUpError.message,
                    status: signUpError?.status,
                    details: signUpError?.details,
                });
                throw signUpError;
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
            console.error('Full error object:', error);
            let errorMessage = 'Signup failed: ';
            
            if (error.message) {
                errorMessage += error.message;
            } else if (error.msg) {
                errorMessage += error.msg;
            } else if (error.error_description) {
                errorMessage += error.error_description;
            } else {
                errorMessage += 'Unknown error occurred';
            }

            // Check for specific error types
            if (error.message?.includes('duplicate')) {
                errorMessage = 'This email is already registered. Please try logging in instead.';
            } else if (error.message?.includes('password')) {
                errorMessage = 'Password must be at least 6 characters long.';
            }

            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>
            <div className="floating-shape shape-4"></div>
            
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
