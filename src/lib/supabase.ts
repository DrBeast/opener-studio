
import { createClient } from "@supabase/supabase-js";

// In a real production environment, these should be set as environment variables
// For now, we'll use placeholders so the app can load for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://example.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

// Log a warning if environment variables are missing
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables. " +
    "Using placeholder values for development."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
