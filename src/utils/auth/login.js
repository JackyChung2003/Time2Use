import supabase from '../../config/supabaseClient';

export const loginWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error("Email login failed:", error.message);
        throw error;
    }
    // console.log("Login successful:", data);
    return data;
};