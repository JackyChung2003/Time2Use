import { createClient } from '@supabase/supabase-js';

// Use environment variables defined in `.env`
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is not defined. Check your .env file.");
    throw new Error("Missing Supabase configuration.");
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, { 
    auth: {
        persistSession: true, // Ensure sessions are persisted
        autoRefreshToken: true, // Automatically refresh expired tokens
    },
}
);

export default supabase;