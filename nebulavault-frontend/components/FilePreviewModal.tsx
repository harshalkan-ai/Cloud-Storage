'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, FileQuestion } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiGetFileViewUrl } from '@/lib/api';
import { File as FileType } from '@/types';
import { isImage, isPdf } from '@/lib/utils';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  file: FileType | null;
}

export default function FilePreviewModal({
  open,
  onClose,
  file,
}: FilePreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && file) {
      setLoading(true);
      setError('');
      setUrl(null);
      apiGetFileViewUrl(file.id)
        .then((res) => setUrl(res.url))
        .catch((err) => setError(err.message || 'Failed to load file'))
        .finally(() => setLoading(false));
    }
  }, [open, file]);

  const handleDownload = () => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.name || 'download';
      a.click();
    }
  };

  const canPreviewAsImage = file && isImage(file.type, file.name);
  const canPreviewAsPdf = file && isPdf(file.type, file.name);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden border-[#dadce0] bg-white">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-[#dadce0] flex-shrink-0">
          <DialogTitle className="text-sm font-semibold text-[#202124] truncate max-w-md">
            {file?.name ?? 'Preview'}
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!url}
            className="gap-2 border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
          >
            <Download className="h-4 w-4 text-[#5f6368]" />
            Download
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#f8fafd] min-h-[400px]">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-[#5f6368]">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
              <p className="text-sm">Loading preview...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 text-red-600">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {url && !loading && canPreviewAsImage && (
            <img
              src={url}
              alt={file?.name}
              className="max-h-[70vh] max-w-full object-contain rounded-lg"
            />
          )}

          {url && !loading && canPreviewAsPdf && (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded-none border-0"
              title={file?.name}
            />
          )}

          {url && !loading && !canPreviewAsImage && !canPreviewAsPdf && (
            <div className="flex flex-col items-center gap-4 text-[#5f6368] p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e8eaed]">
                <FileQuestion className="h-10 w-10 text-[#5f6368]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#202124]">
                  Preview not available
                </p>
                <p className="text-xs text-[#5f6368] mt-1">
                  This file type cannot be previewed directly.
                </p>
              </div>
              <Button onClick={handleDownload} size="sm" className="bg-[#1a73e8] text-white">
                <Download className="h-4 w-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
