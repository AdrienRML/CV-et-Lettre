import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// Helper to get user from session token (simple token = user id)
export async function getUserFromToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.replace('Bearer ', '');

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('session_token', token)
        .single();

    if (error || !data) return null;
    return data;
}

export function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
