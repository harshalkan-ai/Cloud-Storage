import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

export const shareResource = async (req: AuthRequest, res: Response) => {
    try {
        const { email, resourceId, resourceType, permission } = req.body;

        // 1. Find the user we want to share with by their email
        const { data: grantee, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (userError || !grantee) return res.status(404).json({ error: "User not found with this email" });

        // 2. Add the entry to the shares table
        const shareData: any = {
            grantee_id: grantee.id,
            permission: permission || 'viewer'
        };

        if (resourceType === 'file') shareData.file_id = resourceId;
        if (resourceType === 'folder') shareData.folder_id = resourceId;

        const { error: shareError } = await supabase
            .from('shares')
            .insert([shareData]);

        if (shareError) throw shareError;

        res.status(201).json({ message: `Resource shared with ${email} successfully` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};