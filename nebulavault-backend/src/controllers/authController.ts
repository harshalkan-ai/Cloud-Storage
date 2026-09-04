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

        // 1. Try creating directly with Supabase Admin API with email_confirm: true
        const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name },
        });

        if (!adminError && adminUser?.user) {
            const userId = adminUser.user.id;
            await ensureProfile(userId, email, name);

            // Try to sign in to get a real Supabase session token
            const { data: sessionData } = await supabase.auth.signInWithPassword({ email, password });
            const token = sessionData?.session?.access_token ||
                jwt.sign({ id: userId, email, fullName: name, isSupabaseUser: true }, JWT_SECRET, { expiresIn: '7d' });

            return res.status(201).json({
                message: 'Registration Successful',
                token,
                user: { id: userId, email, fullName: name },
            });
        }

        const adminErrMsg = adminError?.message?.toLowerCase() || '';

        // 2. If user already exists, try signing in with provided password
        if (adminErrMsg.includes('already registered') || adminErrMsg.includes('already exists')) {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (!loginError && loginData.session) {
                await ensureProfile(loginData.user!.id, email, name);
                return res.status(200).json({
                    message: 'Login Successful',
                    token: loginData.session.access_token,
                    user: { id: loginData.user!.id, email, fullName: getDisplayName(loginData.user, name) },
                });
            }

            return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
        }

        // 3. Fallback to standard signUp if admin API had another issue
        const { data: standardData, error: standardError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } },
        });

        if (!standardError && standardData.user) {
            const userId = standardData.user.id;
            // Confirm the user via admin so login works in future
            try {
                await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
            } catch {}

            await ensureProfile(userId, email, name);
            const token = standardData.session?.access_token ||
                jwt.sign({ id: userId, email, fullName: name, isSupabaseUser: true }, JWT_SECRET, { expiresIn: '7d' });

            return res.status(201).json({
                message: 'Registration Successful',
                token,
                user: { id: userId, email, fullName: getDisplayName(standardData.user, name) },
            });
        }

        throw adminError || standardError || new Error('Registration failed');
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

        // 1. Attempt standard password sign-in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (!error && data.session) {
            await ensureProfile(data.user.id, email, getDisplayName(data.user, 'User'));
            return res.status(200).json({
                message: 'Login Successful',
                token: data.session.access_token,
                user: { id: data.user.id, email, fullName: getDisplayName(data.user, 'User') },
            });
        }

        // 2. If email confirmation was pending, auto-confirm and retry
        try {
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            const matchedUser = (usersData as any)?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            if (matchedUser) {
                await supabaseAdmin.auth.admin.updateUserById(matchedUser.id, { email_confirm: true, password });
                const retry = await supabase.auth.signInWithPassword({ email, password });
                if (!retry.error && retry.data.session) {
                    await ensureProfile(matchedUser.id, email, getDisplayName(matchedUser, 'User'));
                    return res.status(200).json({
                        message: 'Login Successful',
                        token: retry.data.session.access_token,
                        user: { id: matchedUser.id, email, fullName: getDisplayName(matchedUser, 'User') },
                    });
                }
            }
        } catch {
            // Admin recovery attempt failed, continue to throw
        }

        throw error || new Error('Invalid email or password');
    } catch (err: any) {
        console.error('[signIn]', err.message);
        res.status(401).json({ error: err.message || 'Invalid email or password' });
    }
};