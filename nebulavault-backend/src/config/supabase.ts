import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Default anonymous client (for auth operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client — bypasses ALL Row Level Security policies
// Use this for all DB reads/writes on the backend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

// Authenticated client for per-request user token passthrough (optional)
export const getAuthSupabase = (token?: string) => {
    if (!token) return supabaseAdmin;
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });
};