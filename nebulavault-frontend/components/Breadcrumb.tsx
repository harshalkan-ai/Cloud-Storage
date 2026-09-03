'use client';

import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm font-medium" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center gap-1">
            {index === 0 ? (
              <button
                onClick={() => onNavigate(item)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors duration-150',
                  isLast
                    ? 'text-[#202124] font-semibold cursor-default text-lg'
                    : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]'
                )}
              >
                {item.name}
              </button>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 text-[#5f6368]" />
                <button
                  onClick={() => !isLast && onNavigate(item)}
                  className={cn(
                    'rounded-lg px-2 py-1 transition-colors duration-150',
                    isLast
                      ? 'text-[#202124] font-semibold cursor-default text-lg'
                      : 'text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] cursor-pointer'
                  )}
                >
                  {item.name}
                </button>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
