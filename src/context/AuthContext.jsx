import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../config/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

    useEffect(() => {
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);
            if (event === 'SIGNED_OUT') {
                // Clear role when signed out
                localStorage.removeItem('userRole');
                setUserRole(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const updateUserRole = (role) => {
        if (role) {
            localStorage.setItem('userRole', role);
        } else {
            localStorage.removeItem('userRole');
        }
        setUserRole(role);
    };

    return (
        <AuthContext.Provider value={{ userRole, updateUserRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
