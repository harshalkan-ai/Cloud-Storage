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
import { useDashboardContext } from '../layout';
import {
  apiFetchFolders,
  apiFetchFiles,
  apiToggleStar,
  apiMoveToTrash,
  apiGetFileViewUrl,
  isAuthError,
} from '@/lib/api';
import { Folder, File as FileType, BreadcrumbItem } from '@/types';

export default function DashboardPage() {
  const { searchTerm, refreshKey } = useDashboardContext();
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
      if (!isAuthError(err)) {
        console.error('Failed to load drive content', err);
      }
      // AuthError: token not ready yet — layout will re-render once auth completes
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, searchTerm]);

  useEffect(() => {
    loadContent();
  }, [loadContent, refreshKey]);

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

  // In-platform File Preview: opens rich in-platform modal viewer
  const handleViewFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      setPreviewFile(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dadce0]">
        <Breadcrumb items={breadcrumbs} onNavigate={handleBreadcrumbClick} />

        <div className="flex items-center gap-2">
          <Button
            id="new-folder-button"
            variant="outline"
            size="sm"
            onClick={() => setIsNewFolderOpen(true)}
            className="gap-2 border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
          >
            <FolderPlus className="h-4 w-4 text-[#5f6368]" />
            New Folder
          </Button>
          <Button
            id="upload-file-button"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="gap-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-[#5f6368] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
          <p className="text-sm">Loading contents...</p>
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-[#5f6368] gap-3 border-2 border-dashed border-[#dadce0] rounded-3xl p-8 bg-[#f8fafd]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f3f4]">
            <Inbox className="h-8 w-8 text-[#5f6368]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#202124]">
              {searchTerm ? 'No items matched your search' : 'This folder is empty'}
            </p>
            <p className="text-xs text-[#5f6368] mt-1 max-w-sm">
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
                className="border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
              >
                <FolderPlus className="h-4 w-4 text-[#5f6368]" />
                New Folder
              </Button>
              <Button
                size="sm"
                onClick={() => setIsUploadOpen(true)}
                className="bg-[#1a73e8] text-white hover:bg-[#1557b0]"
              >
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
              <h2 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
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
              <h2 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider">
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
