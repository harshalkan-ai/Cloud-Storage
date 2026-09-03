'use client';

import { Folder, MoreVertical, Trash2, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Folder as FolderType } from '@/types';
import { formatDate } from '@/lib/utils';

interface FolderCardProps {
  folder: FolderType;
  viewMode: 'grid' | 'list';
  onClick: () => void;
  onMoveToTrash: (id: string) => void;
  onShare: (id: string) => void;
}

export default function FolderCard({
  folder,
  viewMode,
  onClick,
  onMoveToTrash,
  onShare,
}: FolderCardProps) {
  if (viewMode === 'list') {
    return (
      <div
        className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-[#f1f3f4] transition-all duration-150 cursor-pointer border-b border-[#f1f3f4]"
        onDoubleClick={onClick}
        onClick={onClick}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f3f4] flex-shrink-0">
          <Folder className="h-5 w-5 text-[#5f6368] fill-[#5f6368]/20" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#202124] truncate">
            {folder.name}
          </p>
        </div>
        <p className="hidden md:block text-xs text-[#5f6368] flex-shrink-0">
          {formatDate(folder.created_at)}
        </p>
        <p className="text-xs text-[#5f6368] flex-shrink-0 w-16 text-right">
          Folder
        </p>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id={`folder-menu-${folder.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124] opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#dadce0]">
              <DropdownMenuItem onClick={() => onShare(folder.id)}>
                <Share2 className="h-4 w-4 text-[#5f6368]" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e0e0e0]" />
              <DropdownMenuItem
                onClick={() => onMoveToTrash(folder.id)}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`folder-card-${folder.id}`}
      className="group relative flex items-center gap-3 rounded-xl border border-[#dadce0] bg-white p-3.5 cursor-pointer hover:bg-[#f8fafd] hover:border-[#bdc1c6] hover:shadow-xs transition-all duration-150"
      onDoubleClick={onClick}
      onClick={onClick}
    >
      <Folder className="h-6 w-6 text-[#5f6368] fill-[#5f6368]/15 flex-shrink-0" />
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-medium text-[#202124] truncate leading-tight">
          {folder.name}
        </p>
      </div>

      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id={`folder-menu-${folder.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#e8eaed] transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-[#dadce0]">
            <DropdownMenuItem onClick={() => onShare(folder.id)}>
              <Share2 className="h-4 w-4 text-[#5f6368]" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e0e0e0]" />
            <DropdownMenuItem
              onClick={() => onMoveToTrash(folder.id)}
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
