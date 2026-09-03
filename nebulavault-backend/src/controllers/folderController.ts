import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest, ensureUserExistsInDb } from '../middleware/authMiddleware';
import crypto from 'crypto';

// 1. Create a New Folder
export const createFolder = async (req: AuthRequest, res: Response) => {
    try {
        const { name, parentId } = req.body;
        const ownerId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Guarantee user exists in database to satisfy foreign keys
        await ensureUserExistsInDb(ownerId, req.user.email);

        const folderId = crypto.randomUUID();

        const { data, error } = await supabaseAdmin
            .from('folders')
            .insert([{
                id: folderId,
                name: name.trim(),
                owner_id: ownerId,
                parent_id: parentId || null,
                is_deleted: false,
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Folder created', folder: data });
    } catch (err: any) {
        console.error('[createFolder]', err.message);
        res.status(400).json({ error: err.message });
    }
};

// 2. Get All Folders for a User
export const getFolders = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user.id;
        const { parentId, search } = req.query;

        let query = supabaseAdmin
            .from('folders')
            .select('*')
            .eq('owner_id', ownerId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        } else if (parentId) {
            query = query.eq('parent_id', parentId as string);
        } else {
            query = query.is('parent_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.status(200).json({ folders: data || [] });
    } catch (err: any) {
        console.error('[getFolders]', err.message);
        res.status(400).json({ error: err.message });
    }
};