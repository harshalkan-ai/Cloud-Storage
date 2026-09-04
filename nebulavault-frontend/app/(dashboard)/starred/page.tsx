'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Loader2 } from 'lucide-react';
import FileCard from '@/components/FileCard';
import ViewToggle from '@/components/ViewToggle';
import ShareModal from '@/components/ShareModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useDashboardContext } from '../layout';
import { apiFetchFiles, apiToggleStar, apiMoveToTrash, apiGetFileViewUrl, isAuthError } from '@/lib/api';
import { File as FileType } from '@/types';

export default function StarredPage() {
  const { searchTerm, refreshKey } = useDashboardContext();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);

  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);

  const loadStarred = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetchFiles({ starred: true, search: searchTerm });
      setFiles(res.files || []);
    } catch (err) {
      if (!isAuthError(err)) {
        console.error('Failed to load starred files', err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadStarred();
  }, [loadStarred, refreshKey]);

  const handleToggleStar = async (id: string, current: boolean) => {
    try {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      await apiToggleStar(id, !current);
    } catch {
      loadStarred();
    }
  };

  const handleMoveToTrash = async (id: string) => {
    try {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      await apiMoveToTrash(id, 'file');
    } catch {
      loadStarred();
    }
  };

  const handleViewFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      setPreviewFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#dadce0]">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <h1 className="text-lg font-semibold text-[#202124]">Starred Files</h1>
        </div>
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-[#5f6368] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
          <p className="text-sm">Loading starred files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-[#5f6368] gap-3 border-2 border-dashed border-[#dadce0] rounded-3xl p-8 bg-[#f8fafd]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <Star className="h-8 w-8 text-[#5f6368]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#202124]">
              No starred files
            </p>
            <p className="text-xs text-[#5f6368] mt-1 max-w-sm">
              Star files in your drive to access them quickly here
            </p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              viewMode="grid"
              onView={handleViewFile}
              onToggleStar={handleToggleStar}
              onShare={(id) => setShareTarget(id)}
              onMoveToTrash={handleMoveToTrash}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              viewMode="list"
              onView={handleViewFile}
              onToggleStar={handleToggleStar}
              onShare={(id) => setShareTarget(id)}
              onMoveToTrash={handleMoveToTrash}
            />
          ))}
        </div>
      )}

      {shareTarget && (
        <ShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          resourceId={shareTarget}
          resourceType="file"
        />
      )}

      <FilePreviewModal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
