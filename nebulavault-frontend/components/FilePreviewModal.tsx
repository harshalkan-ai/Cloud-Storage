'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  Loader2,
  FileQuestion,
  ExternalLink,
  Copy,
  Check,
  FileText,
  FileCode,
  Music,
  Video as VideoIcon,
  File as FileIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiGetFileViewUrl } from '@/lib/api';
import { File as FileType } from '@/types';
import {
  isImage,
  isPdf,
  isVideo,
  isAudio,
  isTextOrCode,
  isOfficeDoc,
  formatFileSize,
  formatDate,
  getFileExtension,
} from '@/lib/utils';

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
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && file) {
      setLoading(true);
      setError('');
      setUrl(null);
      setTextContent(null);
      setCopied(false);

      apiGetFileViewUrl(file.id)
        .then(async (res) => {
          setUrl(res.url);
          // If text or code file, fetch content for inline view
          if (isTextOrCode(file.type, file.name) && res.url) {
            try {
              const textRes = await fetch(res.url);
              if (textRes.ok) {
                const text = await textRes.text();
                setTextContent(text);
              }
            } catch {
              // Ignore text fetch error
            }
          }
        })
        .catch((err) => setError(err.message || 'Failed to load file preview'))
        .finally(() => setLoading(false));
    }
  }, [open, file]);

  const handleDownload = () => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = file?.name || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleCopyLink = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!file) return null;

  const canImage = isImage(file.type, file.name);
  const canPdf = isPdf(file.type, file.name);
  const canVideo = isVideo(file.type, file.name);
  const canAudio = isAudio(file.type, file.name);
  const canText = isTextOrCode(file.type, file.name);
  const canOffice = isOfficeDoc(file.type, file.name);
  const ext = getFileExtension(file.name).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[88vh] flex flex-col p-0 overflow-hidden border-[#dadce0] bg-white rounded-2xl shadow-2xl">
        {/* Header Bar */}
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-3.5 border-b border-[#dadce0] flex-shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#1a73e8] flex-shrink-0">
              {canImage ? <FileIcon className="h-5 w-5" /> :
               canPdf ? <FileText className="h-5 w-5 text-red-500" /> :
               canVideo ? <VideoIcon className="h-5 w-5 text-purple-500" /> :
               canAudio ? <Music className="h-5 w-5 text-pink-500" /> :
               canText ? <FileCode className="h-5 w-5 text-cyan-600" /> :
               <FileText className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-[#202124] truncate">
                {file.name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-[#5f6368] mt-0.5">
                <span className="font-medium bg-[#f1f3f4] px-1.5 py-0.5 rounded text-[11px] text-[#3c4043]">
                  {ext || 'FILE'}
                </span>
                <span>•</span>
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {url && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-1.5 h-8 text-xs border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                  title="Copy direct link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenExternal}
                  className="gap-1.5 h-8 text-xs border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#5f6368]" />
                  Open tab
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={!url}
              className="gap-1.5 h-8 text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </DialogHeader>

        {/* Viewer Canvas */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#f8fafd] relative">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-[#5f6368]">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
              <p className="text-sm font-medium">Loading preview inside NebulaVault...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 text-red-600 p-6 text-center">
              <p className="text-sm font-medium">{error}</p>
              <Button onClick={handleDownload} variant="outline" size="sm" className="mt-2">
                Download file
              </Button>
            </div>
          )}

          {/* 1. Image Preview */}
          {url && !loading && canImage && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={url}
                alt={file.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* 2. PDF Preview */}
          {url && !loading && canPdf && (
            <iframe
              src={`${url}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0 bg-white"
              title={file.name}
            />
          )}

          {/* 3. Video Preview */}
          {url && !loading && canVideo && (
            <div className="w-full h-full flex items-center justify-center p-4 bg-black">
              <video
                controls
                autoPlay
                playsInline
                src={url}
                className="max-h-full max-w-full rounded-lg"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* 4. Audio Preview */}
          {url && !loading && canAudio && (
            <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white border border-[#dadce0] rounded-2xl shadow-sm max-w-md w-full">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fce8e6] text-[#d93025]">
                <Music className="h-10 w-10" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-[#202124] truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-[#5f6368] mt-1">{formatFileSize(file.size)}</p>
              </div>
              <audio controls autoPlay src={url} className="w-full" />
            </div>
          )}

          {/* 5. Text / Code Preview */}
          {url && !loading && canText && (
            <div className="w-full h-full p-4 overflow-auto">
              <div className="bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs rounded-xl p-5 shadow-inner overflow-auto max-h-full leading-relaxed">
                <pre className="whitespace-pre-wrap word-break">{textContent ?? 'Loading file contents...'}</pre>
              </div>
            </div>
          )}

          {/* 6. Office Documents (DOCX / PPTX / XLSX) */}
          {url && !loading && canOffice && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                className="w-full h-full border-0 bg-white rounded-lg shadow-xs"
                title={file.name}
              />
            </div>
          )}

          {/* 7. Generic Binary Fallback */}
          {url && !loading && !canImage && !canPdf && !canVideo && !canAudio && !canText && !canOffice && (
            <div className="flex flex-col items-center gap-4 text-[#5f6368] p-8 text-center bg-white border border-[#dadce0] rounded-2xl shadow-sm max-w-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f1f3f4]">
                <FileQuestion className="h-10 w-10 text-[#5f6368]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#202124] truncate max-w-xs">
                  {file.name}
                </p>
                <p className="text-xs text-[#5f6368] mt-1">
                  {formatFileSize(file.size)} • {ext} File
                </p>
              </div>
              <Button onClick={handleDownload} size="sm" className="bg-[#1a73e8] hover:bg-[#1557b0] text-white gap-2">
                <Download className="h-4 w-4" />
                Download file
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
