'use client';

import {
  FileText, FileImage, FileVideo, FileAudio, FileCode, FileArchive,
  File as FileIcon, Star, MoreVertical, Download, Share2, Trash2,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { File as FileType } from '@/types';
import { cn, formatFileSize, formatDate, isImage, isPdf } from '@/lib/utils';

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type === 'application/pdf') return FileText;
  if (type.includes('zip') || type.includes('rar')) return FileArchive;
  if (type.includes('javascript') || type.includes('json') || type.includes('html')) return FileCode;
  return FileIcon;
}

interface FileCardProps {
  file: FileType;
  viewMode: 'grid' | 'list';
  onView: (id: string) => void;
  onToggleStar: (id: string, current: boolean) => void;
  onShare: (id: string) => void;
  onMoveToTrash: (id: string) => void;
}

export default function FileCard({
  file,
  viewMode,
  onView,
  onToggleStar,
  onShare,
  onMoveToTrash,
}: FileCardProps) {
  const Icon = getFileIcon(file.type);
  const canPreview = isImage(file.type, file.name) || isPdf(file.type, file.name);

  const ActionMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id={`file-menu-${file.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8eaed] transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-[#dadce0]">
        <DropdownMenuItem onClick={() => onView(file.id)}>
          <Eye className="h-4 w-4 text-[#5f6368]" />
          View & Preview
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleStar(file.id, file.is_starred)}>
          <Star className={cn('h-4 w-4 text-[#5f6368]', file.is_starred && 'fill-amber-400 text-amber-400')} />
          {file.is_starred ? 'Unstar' : 'Star'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShare(file.id)}>
          <Share2 className="h-4 w-4 text-[#5f6368]" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#e0e0e0]" />
        <DropdownMenuItem
          onClick={() => onMoveToTrash(file.id)}
          className="text-red-600 focus:text-red-700 focus:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Move to Trash
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === 'list') {
    return (
      <div
        id={`file-row-${file.id}`}
        className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-[#f1f3f4] transition-all duration-150 cursor-pointer border-b border-[#f1f3f4]"
        onClick={() => onView(file.id)}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f0fe] flex-shrink-0">
          <Icon className="h-5 w-5 text-[#1a73e8]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#202124] truncate">{file.name}</p>
        </div>
        {file.is_starred && (
          <Star className="h-4 w-4 fill-amber-400 text-amber-400 flex-shrink-0" />
        )}
        <p className="hidden md:block text-xs text-[#5f6368] flex-shrink-0">
          {formatDate(file.created_at)}
        </p>
        <p className="text-xs text-[#5f6368] flex-shrink-0 w-16 text-right">
          {formatFileSize(file.size)}
        </p>
        <div onClick={(e) => e.stopPropagation()}>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ActionMenu />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`file-card-${file.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-[#dadce0] bg-white p-3.5 h-36 cursor-pointer hover:bg-[#f8fafd] hover:border-[#bdc1c6] hover:shadow-xs transition-all duration-150"
      onClick={() => onView(file.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0fe]">
          <Icon className="h-6 w-6 text-[#1a73e8]" />
        </div>
        <div className="flex items-center gap-1">
          {file.is_starred && (
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          )}
          <div
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <ActionMenu />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[#202124] truncate leading-snug">
          {file.name}
        </p>
        <p className="text-xs text-[#5f6368] mt-0.5">{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}
