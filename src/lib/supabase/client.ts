import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if Supabase is properly configured
export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 20;

export function createClient() {
  if (!isSupabaseConfigured) {
    // Return a dummy client that won't crash but won't work
    // This allows pages to render with a "configure Supabase" message
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
