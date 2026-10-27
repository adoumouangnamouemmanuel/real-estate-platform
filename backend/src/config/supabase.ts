import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./env.js";
// Public Auth key only. Fresh clients have no shared mutable user session.
export function getSupabase() {
  const env = getEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
