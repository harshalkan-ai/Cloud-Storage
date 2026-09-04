import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest, ensureUserExistsInDb } from '../middleware/authMiddleware';
import crypto from 'crypto';
import multer from 'multer';

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// 1. Direct Multipart Fast Upload (No client-side CORS issues, real progress)
export const uploadFileDirect = async (req: AuthRequest, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided in request' });
        }

        const userId = req.user.id;
        const folderId = req.body.folderId || null;
        const originalName = file.originalname;
        const fileId = crypto.randomUUID();
        const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${userId}/${Date.now()}-${safeName}`;

        // Ensure user exists in DB foreign keys
        await ensureUserExistsInDb(userId, req.user.email, req.user.fullName);

        // Upload buffer directly to Supabase storage bucket 'vault'
        const { error: uploadError } = await supabaseAdmin.storage
            .from('vault')
            .upload(storagePath, file.buffer, {
                contentType: file.mimetype || 'application/octet-stream',
                upsert: true,
            });

        if (uploadError) {
            console.error('[uploadFileDirect] Storage upload error:', uploadError.message);
            return res.status(500).json({ error: 'Storage upload failed: ' + uploadError.message });
        }

        // Insert metadata record in files table
        const { data: fileData, error: dbError } = await supabaseAdmin
            .from('files')
            .insert([{
                id: fileId,
                name: originalName,
                storage_path: storagePath,
                owner_id: userId,
                folder_id: folderId || null,
                size: file.size,
                type: file.mimetype || 'application/octet-stream',
                is_starred: false,
                is_deleted: false,
            }])
            .select()
            .single();

        if (dbError) {
            console.error('[uploadFileDirect] DB error:', dbError.message);
            return res.status(500).json({ error: 'Failed to record file metadata: ' + dbError.message });
        }

        res.status(200).json({
            message: 'File uploaded successfully',
            file: fileData,
        });
    } catch (err: any) {
        console.error('[uploadFileDirect]', err.message);
        res.status(500).json({ error: err.message || 'Upload failed' });
    }
};

// 2. Get a Presigned Upload URL Ticket (Fallback)
export const getUploadUrl = async (req: AuthRequest, res: Response) => {
    try {
        const { fileName, folderId, fileSize, fileType } = req.body;
        const userId = req.user.id;

        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }

        // Guarantee user exists in database to satisfy foreign keys
        await ensureUserExistsInDb(userId, req.user.email, req.user.fullName);

        const fileId = crypto.randomUUID();
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${userId}/${Date.now()}-${safeName}`;

        // Create presigned upload URL using admin client (bypasses storage RLS)
        const { data: storageData, error: storageErr } = await supabaseAdmin.storage
            .from('vault')
            .createSignedUploadUrl(storagePath);

        if (storageErr) {
            console.error('[getUploadUrl] Storage error:', storageErr.message);
            return res.status(500).json({ error: 'Failed to create upload URL: ' + storageErr.message });
        }

        // Insert file record into DB
        const { data: fileData, error: dbError } = await supabaseAdmin
            .from('files')
            .insert([{
                id: fileId,
                name: fileName,
                storage_path: storagePath,
                owner_id: userId,
                folder_id: folderId || null,
                size: fileSize || 0,
                type: fileType || 'application/octet-stream',
                is_starred: false,
                is_deleted: false,
            }])
            .select()
            .single();

        if (dbError) {
            console.error('[getUploadUrl] DB error:', dbError.message);
            return res.status(500).json({ error: 'Failed to record file: ' + dbError.message });
        }

        res.status(200).json({
            uploadUrl: storageData.signedUrl,
            token: storageData.token,
            path: storagePath,
            file: fileData,
        });
    } catch (err: any) {
        console.error('[getUploadUrl]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 2. Get a 5-Minute Signed URL to View/Download
export const getFileLink = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const { data: file, error: findError } = await supabaseAdmin
            .from('files')
            .select('storage_path')
            .eq('id', id)
            .single();

        if (findError || !file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const { data, error } = await supabaseAdmin.storage
            .from('vault')
            .createSignedUrl(file.storage_path, 300);

        if (error) throw error;

        res.status(200).json({ url: data.signedUrl });
    } catch (err: any) {
        console.error('[getFileLink]', err.message);
        res.status(500).json({ error: err.message });
    }
};

// 3. List Files with Filters & Search
export const getFiles = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user.id;
        const { folderId, search, starred } = req.query;

        let query = supabaseAdmin
            .from('files')
            .select('*')
            .eq('owner_id', ownerId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.ilike('name', `%${search}%`);
        } else if (starred === 'true') {
            query = query.eq('is_starred', true);
        } else if (folderId) {
            query = query.eq('folder_id', folderId as string);
        } else {
            query = query.is('folder_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.status(200).json({ files: data || [] });
    } catch (err: any) {
        console.error('[getFiles]', err.message);
        res.status(400).json({ error: err.message });
    }
};

// 4. Toggle Star / Favorite Status
export const toggleStar = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isStarred } = req.body;
        const ownerId = req.user.id;

        const { data, error } = await supabaseAdmin
            .from('files')
            .update({ is_starred: Boolean(isStarred) })
            .eq('id', id)
            .eq('owner_id', ownerId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ message: 'Star status updated', file: data });
    } catch (err: any) {
        console.error('[toggleStar]', err.message);
        res.status(400).json({ error: err.message });
    }
};