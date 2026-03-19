import { createClient } from "@supabase/supabase-js";
import "server-only";

// Centralized Admin Client with error handling for missing environment variables
// This should only be used in server-side contexts.

export function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("[SUPABASE_ADMIN] CRITICAL ERROR: Env variables missing.", {
            url: !!supabaseUrl,
            key: !!serviceRoleKey
        });
        // We throw a descriptive error that won't show the key in production logs
        throw new Error("Missing Supabase Admin configuration");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
