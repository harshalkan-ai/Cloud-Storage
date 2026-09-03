'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HardDrive, Star, Trash2, Database, Plus, FolderPlus, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatFileSize } from '@/lib/utils';
import { apiFetchFiles } from '@/lib/api';

const navLinks = [
  { href: '/dashboard', label: 'My Drive', icon: HardDrive },
  { href: '/starred', label: 'Starred', icon: Star },
  { href: '/trash', label: 'Trash', icon: Trash2 },
];

interface SidebarProps {
  onNewFolder?: () => void;
  onUploadFile?: () => void;
  refreshKey?: number;
}

export default function Sidebar({ onNewFolder, onUploadFile, refreshKey }: SidebarProps) {
  const pathname = usePathname();
  const [totalUsedBytes, setTotalUsedBytes] = useState(0);

  // Total storage limit (15 GB)
  const MAX_STORAGE_BYTES = 15 * 1024 * 1024 * 1024;

  useEffect(() => {
    // Calculate actual storage used by user files
    apiFetchFiles({})
      .then((res) => {
        const total = (res.files || []).reduce((acc, f) => acc + (f.size || 0), 0);
        setTotalUsedBytes(total);
      })
      .catch(() => {
        setTotalUsedBytes(0);
      });
  }, [pathname, refreshKey]);

  const usedPercentage = Math.min(
    Math.round((totalUsedBytes / MAX_STORAGE_BYTES) * 100),
    100
  );

  return (
    <aside className="flex flex-col w-60 min-h-[calc(100vh-4rem)] bg-white border-r border-[#dadce0] px-3 py-4 gap-4">
      {/* "+ New" Dropdown Button */}
      <div className="px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="sidebar-new-button"
              className="flex items-center gap-3 bg-white border border-[#dadce0] hover:bg-[#f8fafd] text-[#1f1f1f] rounded-2xl px-5 py-3 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm w-max cursor-pointer"
            >
              <Plus className="h-6 w-6 text-[#1a73e8]" />
              <span className="font-semibold text-[#3c4043]">New</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 border-[#dadce0] p-1 shadow-lg">
            <DropdownMenuItem
              onClick={onNewFolder}
              className="gap-3 py-2.5 cursor-pointer text-[#3c4043] focus:bg-[#f1f3f4]"
            >
              <FolderPlus className="h-4 w-4 text-[#5f6368]" />
              New folder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onUploadFile}
              className="gap-3 py-2.5 cursor-pointer text-[#3c4043] focus:bg-[#f1f3f4]"
            >
              <Upload className="h-4 w-4 text-[#5f6368]" />
              File upload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 mt-2">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase().replace(' ', '-')}`}
              className={cn(
                'flex items-center gap-4 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#c2e7ff] text-[#001d35] font-semibold'
                  : 'text-[#444746] hover:bg-[#f1f3f4] hover:text-[#1f1f1f]'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-[#001d35]' : 'text-[#444746]'
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Storage Indicator */}
      <div className="mt-auto px-2 pb-2">
        <div className="space-y-2 text-xs text-[#5f6368]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#5f6368]" />
            <span className="font-medium text-[#3c4043]">Storage</span>
          </div>
          <Progress value={usedPercentage} className="h-1.5 bg-[#e0e0e0]" />
          <div className="flex justify-between text-xs text-[#5f6368]">
            <span>{formatFileSize(totalUsedBytes)} used</span>
            <span>15 GB</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
