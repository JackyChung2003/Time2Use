// // import { useState } from 'react';
// // import { loginWithEmail } from '../../../utils/auth/login';
// import { loginWithGitHub } from '../../../utils/auth/oauth';
// import { useNavigate } from 'react-router-dom';

// const Login = () => {
//     const navigate = useNavigate();
//     // const [email, setEmail] = useState('');
//     // const [password, setPassword] = useState('');

//     // // Email/password login handler
//     // const handleEmailLogin = async (e) => {
//     //     e.preventDefault();
//     //     try {
//     //         const { user } = await loginWithEmail(email, password);
//     //         alert(`Welcome back, ${user.email}!`);
//     //     } catch (error) {
//     //         alert(`Login failed: ${error.message}`);
//     //     }
//     // };

//     // GitHub login handler
//     const handleGitHubLogin = async () => {
//         try {
//             const { data, error } = await loginWithGitHub();
    
//             if (error) {
//                 throw error;
//             }
    
//             const user = data.user;
    
//             // Check if the email exists; fallback to "GitHub User" if not
//             const email = user?.email || 'GitHub User';
//             alert(`Welcome, ${email}!`);
//         } catch (error) {
//             console.error("GitHub login failed:", error.message);
//             alert(`GitHub login failed: ${error.message}`);
//         }
//     };

//     return (
//         <div>
//             <h1>Login</h1>
//             {/* Email/password login form */}
//             {/* <form onSubmit={handleEmailLogin}>
//                 <input
//                     type="email"
//                     placeholder="Email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                 />
//                 <input
//                     type="password"
//                     placeholder="Password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <button type="submit">Login with Email</button>
//             </form> */}

//             <hr />

//             {/* GitHub login button */}
//             <button onClick={handleGitHubLogin}>Login with GitHub</button>
//             <hr />
//             <p>
//                 Dont have an account?{' '}
//                 <button onClick={() => navigate('/signup')}>Sign Up</button>
//             </p>
//         </div>
//     );
// };

// export default Login;

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
            navigate('/dashboard'); // Redirect after login
        } catch (error) {
            console.error('Login failed:', error.message);
            alert(`Login failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Login</h1>
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
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p>
                Dont have an account?{' '}
                <button onClick={() => navigate('/signup')}>Sign Up</button>
            </p>
        </div>
    );
};

export default Login;
