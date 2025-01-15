//import './index.css'; // Import the CSS file
import { useState } from 'react';
import supabase from '../../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.api.resetPasswordForEmail(email);

            if (error) {
                alert(`Error: ${error.message}`);
                throw error;
            }

            setMessage('Password reset email sent! Please check your inbox.');
        } catch (error) {
            console.error('Error:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1 className="header">Forgot Password</h1>
            <form onSubmit={handleForgotPassword}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit" className="forgot-password-button" disabled={loading}>
                    {loading ? 'Sending email...' : 'Send Reset Link'}
                </button>
            </form>
            {message && <p className="message">{message}</p>}
            <p className="footer">
                Remember your password?{' '}
                <button className="signup-link" onClick={() => navigate('/login')}>
                    Login
                </button>
            </p>
        </div>
    );
};

export default ForgotPassword;
