// import supabase from '../../config/supabaseClient';
// import { useNavigate } from 'react-router-dom';

// const Dashboard = () => {
//     const navigate = useNavigate();

//     const handleSignOut = async () => {
//         const { error } = await supabase.auth.signOut();
//         if (error) {
//             console.error('Sign-out error:', error.message);
//         } else {
//             // Navigate the user back to the login page
//             navigate('/login');
//         }
//     };

//     return (
//         <div style={{ padding: '20px' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <h1>Dashboard</h1>
//                 <button
//                     onClick={handleSignOut}
//                     style={{
//                         padding: '10px 20px',
//                         backgroundColor: '#f44336',
//                         color: '#fff',
//                         border: 'none',
//                         borderRadius: '5px',
//                         cursor: 'pointer',
//                     }}
//                 >
//                     Sign Out
//                 </button>
//             </div>
//             <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
//                 <div style={{ width: '30%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
//                     <h2>Widget 1</h2>
//                     <p>Some content for widget 1.</p>
//                 </div>
//                 <div style={{ width: '30%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
//                     <h2>Widget 2</h2>
//                     <p>Some content for widget 2.</p>
//                 </div>
//                 <div style={{ width: '30%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
//                     <h2>Widget 3</h2>
//                     <p>Some content for widget 3.</p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Dashboard;


import { useEffect, useState } from 'react';
import supabase from '../../../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error fetching user:', error.message);
                navigate('/login'); // Redirect if no session
            } else {
                setUser(data?.session?.user || null);
            }
        };
        fetchUser();
    }, [navigate]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign-out error:', error.message);
        } else {
            navigate('/login');
        }
    };

    return (
        <div>
            <h1>Dashboard</h1>
            {user && <p>Welcome, {user.email}</p>}
            <button onClick={handleSignOut}>Sign Out</button>
        </div>
    );
};

export default Dashboard;
