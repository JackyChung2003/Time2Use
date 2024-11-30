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
//             // Sign up the user
//             const { data, error } = await supabase.auth.signUp({
//                 email,
//                 password,
//             });

//             if (error) {
//                 throw new Error(error.message);
//             }

//             // Notify the user about email verification
//             alert('Account created! Please verify your email.');

//             // Redirect to the login page
//             navigate('/login');
//         } catch (error) {
//             console.error('Signup failed:', error.message);
//             alert(`Signup failed: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div>
//             <h1>Sign Up</h1>
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
//                 <button type="submit" disabled={loading}>
//                     {loading ? 'Signing Up...' : 'Sign Up'}
//                 </button>
//             </form>
//             <p>
//                 Already have an account?{' '}
//                 <button
//                     onClick={() => navigate('/login')}
//                     style={{
//                         background: 'none',
//                         border: 'none',
//                         color: 'blue',
//                         cursor: 'pointer',
//                         textDecoration: 'underline',
//                     }}
//                 >
//                     Log in here
//                 </button>
//             </p>
//         </div>
//     );
// };

// export default Signup;

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
                    data: { role: 'user' }, // Default user role
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
        <div>
            <h1>Sign Up</h1>
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
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <p>
                Already have an account?{' '}
                <button onClick={() => navigate('/login')}>Log in here</button>
            </p>
        </div>
    );
};

export default Signup;
