// import { Navigate } from 'react-router-dom';
// import supabase from '../config/supabaseClient';

// // eslint-disable-next-line react/prop-types
// const ProtectedRoute = ({ children }) => {
//     // Check if user is logged in
//     const user = supabase.auth.getUser(); // Adjust as per Supabase's current auth API

//     if (!user) {
//         // Redirect to login if user is not authenticated
//         return <Navigate to="/login" />;
//     }

//     // Render the protected component
//     return children;
// };

// export default ProtectedRoute;

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
// import supabase from '../../config/supabaseClient';
import supabase from '../config/supabaseClient';
import CommonLoader from './Loader/CommonLoader';

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) {
                setIsAuthenticated(false);
            } else {
                setIsAuthenticated(true);
            }
        };
        checkSession();
    }, []);

    if (isAuthenticated === null) {
        return  <CommonLoader />
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
