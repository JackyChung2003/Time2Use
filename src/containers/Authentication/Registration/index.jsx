// import './index.css';
// import { useState } from 'react';
// import supabase from '../../../config/supabaseClient';
// import { useNavigate } from 'react-router-dom';

// const SignUp = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleEmailSignUp = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             // Create user in Supabase auth
//             const { data, error } = await supabase.auth.signUp({
//                 email,
//                 password
//             });

//             if (error) throw error;

//             // Add the user to your 'users' table with default 'user' role
//             const { error: insertError } = await supabase
//                 .from('users')
//                 .insert([{ id: data.user.id, email: data.user.email, role: 'user' }]);

//             if (insertError) throw insertError;

//             alert('Account created successfully!');
//             navigate('/login');
//         } catch (error) {
//             console.error('Sign up failed:', error.message);
//             alert(`Sign up failed: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="container">
//             <h1 className="header">Sign Up</h1>
//             <form onSubmit={handleEmailSignUp}>
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
//                 <button type="submit" className="signup-button" disabled={loading}>
//                     {loading ? 'Creating Account...' : 'Sign Up'}
//                 </button>
//             </form>
//             <p className="footer">
//                 Already have an account?{' '}
//                 <button className="login-link" onClick={() => navigate('/login')}>
//                     Login
//                 </button>
//             </p>
//         </div>
//     );
// };

// export default SignUp;

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


// original code
// import './index.css';
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import supabase from '../../../config/supabaseClient';

// const Signup = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     const handleSignup = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const { data, error } = await supabase.auth.signUp({
//                 email,
//                 password,
//                 options: {
//                     data: { role: 'user' }, // Default user role
//                 },
//             });

//             if (error) throw error;

//             alert('Account created! Please verify your email.');
//             navigate('/login');
//         } catch (error) {
//             console.error('Signup failed:', error.message);
//             alert(`Signup failed: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="signup-container">
//             <h1 className="signup-header">Sign Up</h1>
//             <form onSubmit={handleSignup}>
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
//                 <button type="submit" className="signup-button" disabled={loading}>
//                     {loading ? 'Signing Up...' : 'Sign Up'}
//                 </button>
//             </form>
//             <p>
//                 Already have an account?{' '}
//                 <button className="login-link" onClick={() => navigate('/login')}>
//                     Log in here
//                 </button>
//             </p>
//         </div>

//     );
// };

// export default Signup;
