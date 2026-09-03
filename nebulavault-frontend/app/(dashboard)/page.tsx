'use client';

import { useState, useEffect, useCallback } from 'react';
import { FolderPlus, Upload, Loader2, HardDrive, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/Breadcrumb';
import FolderCard from '@/components/FolderCard';
import FileCard from '@/components/FileCard';
import ViewToggle from '@/components/ViewToggle';
import NewFolderModal from '@/components/NewFolderModal';
import UploadModal from '@/components/UploadModal';
import ShareModal from '@/components/ShareModal';
import FilePreviewModal from '@/components/FilePreviewModal';
import { useDashboardContext } from './layout';
import {
  apiFetchFolders,
  apiFetchFiles,
  apiToggleStar,
  apiMoveToTrash,
} from '@/lib/api';
import { Folder, File as FileType, BreadcrumbItem } from '@/types';

export default function MyDrivePage() {
  const { searchTerm } = useDashboardContext();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Breadcrumb navigation stack
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: 'My Drive' },
  ]);

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;

  // State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{
    id: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileType | null>(null);

  // Fetch data
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        apiFetchFolders({ parentId: currentFolderId, search: searchTerm }),
        apiFetchFiles({ folderId: currentFolderId, search: searchTerm }),
      ]);
      setFolders(foldersRes.folders || []);
      setFiles(filesRes.files || []);
    } catch (err) {
      console.error('Failed to load drive content', err);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, searchTerm]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Navigation handlers
  const handleEnterFolder = (folder: Folder) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    const idx = breadcrumbs.findIndex((b) => b.id === item.id);
    if (idx !== -1) {
      setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
    }
  };

  // Star handler
  const handleToggleStar = async (id: string, current: boolean) => {
    try {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_starred: !current } : f))
      );
      await apiToggleStar(id, !current);
    } catch {
      loadContent();
    }
  };

  // Move to trash handler
  const handleMoveToTrash = async (id: string, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } else {
        setFolders((prev) => prev.filter((f) => f.id !== id));
      }
      await apiMoveToTrash(id, type);
    } catch {
      loadContent();
    }
  };

  // Preview handler
  const handleViewFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) setPreviewFile(file);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <Breadcrumb items={breadcrumbs} onNavigate={handleBreadcrumbClick} />

        <div className="flex items-center gap-2">
          <Button
            id="new-folder-button"
            variant="outline"
            size="sm"
            onClick={() => setIsNewFolderOpen(true)}
            className="gap-2"
          >
            <FolderPlus className="h-4 w-4 text-amber-400" />
            New Folder
          </Button>
          <Button
            id="upload-file-button"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm">Loading contents...</p>
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-zinc-500 gap-3 border-2 border-dashed border-zinc-800/80 rounded-3xl p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-900 border border-zinc-800">
            <Inbox className="h-8 w-8 text-zinc-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-zinc-300">
              {searchTerm ? 'No items matched your search' : 'This folder is empty'}
            </p>
            <p className="text-xs text-zinc-600 mt-1 max-w-sm">
              {searchTerm
                ? 'Try searching for something else'
                : 'Upload files or create a new folder to get started'}
            </p>
          </div>
          {!searchTerm && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewFolderOpen(true)}
              >
                <FolderPlus className="h-4 w-4 text-amber-400" />
                New Folder
              </Button>
              <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Folders ({folders.length})
              </h2>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      viewMode="grid"
                      onClick={() => handleEnterFolder(folder)}
                      onMoveToTrash={(id) => handleMoveToTrash(id, 'folder')}
                      onShare={(id) => setShareTarget({ id, type: 'folder' })}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      viewMode="list"
                      onClick={() => handleEnterFolder(folder)}
                      onMoveToTrash={(id) => handleMoveToTrash(id, 'folder')}
                      onShare={(id) => setShareTarget({ id, type: 'folder' })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files Section */}
          {files.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Files ({files.length})
              </h2>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      viewMode="grid"
                      onView={handleViewFile}
                      onToggleStar={handleToggleStar}
                      onShare={(id) => setShareTarget({ id, type: 'file' })}
                      onMoveToTrash={(id) => handleMoveToTrash(id, 'file')}
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
                      onShare={(id) => setShareTarget({ id, type: 'file' })}
                      onMoveToTrash={(id) => handleMoveToTrash(id, 'file')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <NewFolderModal
        open={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        parentId={currentFolderId}
        onCreated={loadContent}
      />

      <UploadModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folderId={currentFolderId}
        onUploaded={loadContent}
      />

      {shareTarget && (
        <ShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          resourceId={shareTarget.id}
          resourceType={shareTarget.type}
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
