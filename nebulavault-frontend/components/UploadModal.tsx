'use client';

import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiGetUploadTicket, apiUploadToStorage } from '@/lib/api';
import { cn, formatFileSize } from '@/lib/utils';

interface UploadFile {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  errorMsg?: string;
}

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  onUploaded: () => void;
}

export default function UploadModal({
  open,
  onClose,
  folderId,
  onUploaded,
}: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).map((f) => ({
      file: f,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...arr]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'pending') continue;

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading', progress: 10 } : f
        )
      );

      try {
        const { file } = files[i];
        const ticket = await apiGetUploadTicket({
          fileName: file.name,
          folderId,
          fileSize: file.size,
          fileType: file.type,
        });

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 40 } : f))
        );

        await apiUploadToStorage(ticket.uploadUrl, file);

        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'done', progress: 100 } : f
          )
        );
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error', errorMsg: err.message }
              : f
          )
        );
      }
    }
    onUploaded();
  };

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done');
  const hasUploading = files.some((f) => f.status === 'uploading');
  const hasPending = files.some((f) => f.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg border-[#dadce0] bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe]">
              <CloudUpload className="h-5 w-5 text-[#1a73e8]" />
            </div>
            <DialogTitle className="text-lg font-semibold text-[#202124]">
              Upload files
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#5f6368]">
            Drag & drop files or click to browse.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-150',
            isDragging
              ? 'border-[#1a73e8] bg-[#e8f0fe]/50'
              : 'border-[#dadce0] hover:border-[#bdc1c6] hover:bg-[#f8fafd]'
          )}
        >
          <input
            id="file-input"
            type="file"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
            isDragging ? 'bg-[#c2e7ff]' : 'bg-[#f1f3f4]'
          )}>
            <Upload className="h-6 w-6 text-[#1a73e8]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[#202124]">
              {isDragging ? 'Drop to upload' : 'Drop files here'}
            </p>
            <p className="text-xs text-[#5f6368] mt-0.5">or click to browse</p>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {files.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-[#dadce0] bg-[#f8fafd] px-3.5 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#202124] truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-[#5f6368]">
                    {formatFileSize(item.file.size)}
                  </p>
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="mt-1.5 h-1" />
                  )}
                  {item.errorMsg && (
                    <p className="text-xs text-red-600 mt-0.5">{item.errorMsg}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {item.status === 'pending' && (
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-[#5f6368] hover:text-[#202124] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 className="h-4 w-4 text-[#1a73e8] animate-spin" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={hasUploading} className="border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]">
            {allDone ? 'Done' : 'Cancel'}
          </Button>
          {hasPending && (
            <Button
              id="upload-submit"
              onClick={uploadAll}
              disabled={hasUploading}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            >
              {hasUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload {files.filter((f) => f.status === 'pending').length} file
              {files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
