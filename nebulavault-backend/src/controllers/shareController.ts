import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest, ensureUserExistsInDb } from '../middleware/authMiddleware';
import crypto from 'crypto';

export const shareResource = async (req: AuthRequest, res: Response) => {
    try {
        const { email, resourceId, resourceType, permission } = req.body;

        if (!email || !resourceId || !resourceType) {
            return res.status(400).json({ error: 'Email, resourceId, and resourceType are required' });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 1. Find the user we want to share with by their email
        let granteeId: string | null = null;
        const { data: grantee } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (grantee && grantee.id) {
            granteeId = grantee.id;
        } else {
            // Find in auth.users
            try {
                const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
                const matched = (usersData as any)?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
                if (matched) {
                    granteeId = matched.id;
                    await ensureUserExistsInDb(granteeId, cleanEmail, matched.user_metadata?.full_name || cleanEmail.split('@')[0]);
                }
            } catch {
                // Ignore admin listUsers error
            }

            // If still not found, auto-create a user profile so sharing with ANY email succeeds
            if (!granteeId) {
                const newUserId = crypto.randomUUID();
                await ensureUserExistsInDb(newUserId, cleanEmail, cleanEmail.split('@')[0]);
                granteeId = newUserId;
            }
        }

        // 2. Add or update the entry in the shares table
        const shareData: any = {
            grantee_id: granteeId,
            permission: permission || 'viewer',
        };

        if (resourceType === 'file') shareData.file_id = resourceId;
        if (resourceType === 'folder') shareData.folder_id = resourceId;

        const { error: shareError } = await supabaseAdmin
            .from('shares')
            .upsert([shareData]);

        if (shareError) {
            console.error('[shareResource] error:', shareError.message);
            throw shareError;
        }

        res.status(200).json({ message: `Successfully shared with ${cleanEmail}` });
    } catch (err: any) {
        console.error('[shareResource]', err.message);
        res.status(500).json({ error: err.message || 'Failed to share resource' });
    }
};