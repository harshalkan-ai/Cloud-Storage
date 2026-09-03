'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-full border border-[#dadce0] bg-white p-0.5 shadow-2xs">
      <button
        id="view-grid"
        onClick={() => onChange('grid')}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
          viewMode === 'grid'
            ? 'bg-[#e8f0fe] text-[#1a73e8]'
            : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]'
        )}
        title="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        id="view-list"
        onClick={() => onChange('list')}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
          viewMode === 'list'
            ? 'bg-[#e8f0fe] text-[#1a73e8]'
            : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]'
        )}
        title="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
