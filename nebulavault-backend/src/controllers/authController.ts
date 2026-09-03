import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nebulavault-secret-key-2026';

function getDisplayName(user: any, fallback = 'User'): string {
    return (
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.fullName ||
        user?.full_name ||
        fallback
    );
}

async function ensureProfile(id: string, email: string, fullName: string): Promise<void> {
    try {
        await supabaseAdmin.from('profiles').upsert([{ id, email, full_name: fullName }]);
    } catch {
        // Non-critical
    }
}

export const signUp = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const name = fullName || 'User';

        // 1. Try standard signup first
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
        });

        if (!signUpError && signUpData.user) {
            const userId = signUpData.user.id;
            await ensureProfile(userId, email, name);

            // Get token - try login to get session immediately
            let token = signUpData.session?.access_token;
            if (!token) {
                const { data: loginData } = await supabase.auth.signInWithPassword({ email, password });
                token = loginData?.session?.access_token;
            }

            // Fallback: issue local JWT (only if email confirmation prevents login)
            if (!token) {
                token = jwt.sign({ id: userId, email, isSupabaseUser: true }, JWT_SECRET, { expiresIn: '7d' });
            }

            return res.status(201).json({
                message: 'Registration Successful',
                token,
                user: { id: userId, email, fullName: getDisplayName(signUpData.user, name) },
            });
        }

        const errMsg = signUpError?.message?.toLowerCase() || '';

        // 2. If rate limited, try using admin API to create/confirm user
        if (errMsg.includes('rate limit') || errMsg.includes('limit exceeded')) {
            // Try login first (user might already exist)
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (!loginError && loginData.session) {
                await ensureProfile(loginData.user!.id, email, name);
                return res.status(200).json({
                    message: 'Login Successful',
                    token: loginData.session.access_token,
                    user: { id: loginData.user!.id, email, fullName: getDisplayName(loginData.user, name) },
                });
            }

            // Rate limited + user doesn't exist: use admin.createUser to bypass email confirmation
            const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name },
            });

            if (!adminError && adminUser.user) {
                const userId = adminUser.user.id;
                await ensureProfile(userId, email, name);

                // Login to get real session token
                const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
                const token = sessionData?.session?.access_token ||
                    jwt.sign({ id: userId, email, isSupabaseUser: true }, JWT_SECRET, { expiresIn: '7d' });

                return res.status(200).json({
                    message: 'Registration Successful',
                    token,
                    user: { id: userId, email, fullName: name },
                });
            }

            // Last resort: just try to login
            return res.status(400).json({ error: signUpError?.message || 'Registration failed due to rate limiting. Please try again later.' });
        }

        // 3. Email already registered — try login
        if (errMsg.includes('already registered') || errMsg.includes('already exists')) {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (!loginError && loginData.session) {
                await ensureProfile(loginData.user!.id, email, name);
                return res.status(200).json({
                    message: 'Login Successful',
                    token: loginData.session.access_token,
                    user: { id: loginData.user!.id, email, fullName: getDisplayName(loginData.user, name) },
                });
            }
            return res.status(400).json({ error: 'Email already registered. Please sign in instead.' });
        }

        throw signUpError || new Error('Registration failed');
    } catch (err: any) {
        console.error('[signUp]', err.message);
        res.status(400).json({ error: err.message || 'Registration failed' });
    }
};

export const signIn = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (!error && data.session) {
            await ensureProfile(data.user.id, email, getDisplayName(data.user, 'User'));
            return res.status(200).json({
                message: 'Login Successful',
                token: data.session.access_token,
                user: { id: data.user.id, email, fullName: getDisplayName(data.user, 'User') },
            });
        }

        throw error || new Error('Invalid email or password');
    } catch (err: any) {
        console.error('[signIn]', err.message);
        res.status(401).json({ error: err.message || 'Login failed' });
    }
};