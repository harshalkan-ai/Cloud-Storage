import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin, getAuthSupabase } from '../config/supabase';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'nebulavault-secret-key-2026';

export interface AuthRequest extends Request {
    user?: any;
    token?: string;
    supabaseClient?: any;
}

// Convert arbitrary string ID to a valid RFC4122 UUID v4 format
function ensureValidUuid(id: string): string {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) return id;
    const hash = crypto.createHash('md5').update(id).digest('hex');
    return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

// In-memory cache to prevent repeated DB upserts on every API call
const verifiedUsersCache = new Set<string>();

// Guarantee that the user ID exists in both auth.users and profiles table
// to satisfy all database foreign key constraints (folders_owner_id_fkey, files_owner_id_fkey)
export async function ensureUserExistsInDb(userId: string, email?: string, fullName?: string) {
    if (verifiedUsersCache.has(userId)) {
        return;
    }

    const userEmail = email || `user_${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}@gmail.com`;
    const name = fullName || 'User';

    try {
        // 1. Ensure user exists in auth.users
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!existingUser || !existingUser.user) {
            await supabaseAdmin.auth.admin.createUser({
                id: userId,
                email: userEmail,
                email_confirm: true,
                user_metadata: { full_name: name },
            });
        }
    } catch {
        // If already exists with this email/id, ignore
    }

    try {
        // 2. Ensure profile exists in profiles table
        await supabaseAdmin.from('profiles').upsert([
            { id: userId, email: userEmail, full_name: name }
        ]);
        verifiedUsersCache.add(userId);
    } catch {
        // Non-critical
        verifiedUsersCache.add(userId);
    }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    req.token = token;
    req.supabaseClient = getAuthSupabase(token);

    // 1. Fast-path: Check local JWT token verification first (instant, 0 network latency)
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const validId = ensureValidUuid(decoded.id);
        req.user = {
            id: validId,
            email: decoded.email,
            fullName: decoded.fullName || decoded.name || 'User',
        };
        await ensureUserExistsInDb(validId, decoded.email, req.user.fullName);
        return next();
    } catch {
        // Not a local JWT, fallback to Supabase session token
    }

    // 2. Fallback: Supabase Auth token verification
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
            const validId = ensureValidUuid(user.id);
            req.user = {
                ...user,
                id: validId,
                fullName: user.user_metadata?.full_name || 'User',
            };
            await ensureUserExistsInDb(validId, user.email, user.user_metadata?.full_name);
            return next();
        }
    } catch {
        // Token invalid
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
};