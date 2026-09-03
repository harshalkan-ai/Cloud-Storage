'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, Loader2, Folder, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetchTrash, apiRestoreFromTrash, isAuthError } from '@/lib/api';
import { Folder as FolderType, File as FileType } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { useDashboardContext } from '../layout';

export default function TrashPage() {
  const { refreshKey } = useDashboardContext();
  const [trashedFolders, setTrashedFolders] = useState<FolderType[]>([]);
  const [trashedFiles, setTrashedFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetchTrash();
      setTrashedFolders(res.trashedFolders || []);
      setTrashedFiles(res.trashedFiles || []);
    } catch (err) {
      if (!isAuthError(err)) {
        console.error('Failed to load trash', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash, refreshKey]);

  const handleRestore = async (id: string, type: 'file' | 'folder') => {
    setRestoringId(id);
    try {
      await apiRestoreFromTrash(id, type);
      if (type === 'file') {
        setTrashedFiles((prev) => prev.filter((f) => f.id !== id));
      } else {
        setTrashedFolders((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error('Failed to restore item', err);
      loadTrash();
    } finally {
      setRestoringId(null);
    }
  };

  const isEmpty = trashedFolders.length === 0 && trashedFiles.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#dadce0]">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          <h1 className="text-lg font-semibold text-[#202124]">Trash</h1>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-[#5f6368] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
          <p className="text-sm">Loading trash...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-[#5f6368] gap-3 border-2 border-dashed border-[#dadce0] rounded-3xl p-8 bg-[#f8fafd]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <Trash2 className="h-8 w-8 text-[#5f6368]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#202124]">
              Trash is empty
            </p>
            <p className="text-xs text-[#5f6368] mt-1 max-w-sm">
              Deleted files and folders will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders in Trash */}
          {trashedFolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
                Folders ({trashedFolders.length})
              </h2>
              <div className="space-y-1">
                {trashedFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#dadce0] bg-white hover:bg-[#f1f3f4] transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f3f4] flex-shrink-0">
                      <Folder className="h-5 w-5 text-[#5f6368]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#202124] truncate">
                        {folder.name}
                      </p>
                      <p className="text-xs text-[#5f6368]">
                        Deleted folder
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(folder.id, 'folder')}
                      disabled={restoringId === folder.id}
                      className="gap-2 text-xs border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                    >
                      {restoringId === folder.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5 text-[#1a73e8]" />
                      )}
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files in Trash */}
          {trashedFiles.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
                Files ({trashedFiles.length})
              </h2>
              <div className="space-y-1">
                {trashedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#dadce0] bg-white hover:bg-[#f1f3f4] transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] flex-shrink-0">
                      <FileIcon className="h-5 w-5 text-[#1a73e8]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#202124] truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#5f6368]">
                        {formatFileSize(file.size)} • {formatDate(file.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(file.id, 'file')}
                      disabled={restoringId === file.id}
                      className="gap-2 text-xs border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                    >
                      {restoringId === file.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5 text-[#1a73e8]" />
                      )}
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
