import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/authMiddleware';

// 1. Move a File or Folder to Trash (Soft Delete)
export const moveToTrash = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { resourceType } = req.body;
        const userId = req.user.id;

        const tableName = resourceType === 'folder' ? 'folders' : 'files';

        const { error } = await supabaseAdmin
            .from(tableName)
            .update({ is_deleted: true })
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;

        res.status(200).json({ message: `${resourceType} moved to trash successfully` });
    } catch (err: any) {
        console.error('[moveToTrash]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 2. Restore an Item from Trash
export const restoreFromTrash = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { resourceType } = req.body;
        const userId = req.user.id;

        const tableName = resourceType === 'folder' ? 'folders' : 'files';

        const { error } = await supabaseAdmin
            .from(tableName)
            .update({ is_deleted: false })
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;

        res.status(200).json({ message: `${resourceType} restored successfully` });
    } catch (err: any) {
        console.error('[restoreFromTrash]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 3. Get all items currently in Trash
export const getTrashItems = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;

        const [foldersRes, filesRes] = await Promise.all([
            supabaseAdmin.from('folders').select('*').eq('owner_id', userId).eq('is_deleted', true).order('created_at', { ascending: false }),
            supabaseAdmin.from('files').select('*').eq('owner_id', userId).eq('is_deleted', true).order('created_at', { ascending: false }),
        ]);

        if (foldersRes.error) throw foldersRes.error;
        if (filesRes.error) throw filesRes.error;

        res.status(200).json({
            trashedFolders: foldersRes.data || [],
            trashedFiles: filesRes.data || [],
        });
    } catch (err: any) {
        console.error('[getTrashItems]', err.message);
        res.status(500).json({ error: err.message });
    }
};