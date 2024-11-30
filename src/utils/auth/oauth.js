import supabase from '../../config/supabaseClient';

export const loginWithGitHub = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
    });
    if (error) {
        console.error("GitHub login failed:", error.message);
        throw error;
    }
    return data;
};
