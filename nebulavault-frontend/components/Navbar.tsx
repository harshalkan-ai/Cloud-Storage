'use client';

import { useState } from 'react';
import { Search, LogOut, ChevronDown, HardDrive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Works with both Supabase auth user objects and our simplified User type
interface NavbarProps {
  user: any | null;
  onSearch: (term: string) => void;
  onLogout: () => void;
}

function getUserDisplayName(user: any): string {
  if (!user) return 'User';
  return (
    user.fullName ||
    user.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  );
}

function getUserEmail(user: any): string {
  return user?.email || '';
}

function getUserInitial(user: any): string {
  const name = getUserDisplayName(user);
  return name[0]?.toUpperCase() ?? 'U';
}

export default function Navbar({ user, onSearch, onLogout }: NavbarProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (value: string) => {
    setSearchInput(value);
    onSearch(value);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#dadce0] flex items-center px-4 justify-between gap-4">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#1a73e8]">
          <HardDrive className="h-6 w-6" />
        </div>
        <span className="text-xl font-normal text-[#444746] tracking-tight font-sans">
          NebulaVault
        </span>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-2xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5f6368] pointer-events-none" />
        <input
          id="global-search"
          type="search"
          placeholder="Search in Drive"
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-full bg-[#edf2fc] text-[#202124] placeholder-[#5f6368] text-sm focus:outline-none focus:bg-white focus:shadow-md focus:ring-1 focus:ring-[#dadce0] transition-all duration-200"
        />
      </div>

      {/* Right: User Profile & Logout */}
      <div className="min-w-[200px] flex justify-end items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              id="user-menu-trigger"
              className="flex items-center gap-2 rounded-full p-1 hover:bg-[#f1f3f4] transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a73e8] text-white font-medium text-sm shadow-xs">
                {getUserInitial(user)}
              </div>
              <ChevronDown className="h-4 w-4 text-[#5f6368] group-hover:text-[#202124] transition-colors mr-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 border-[#dadce0] shadow-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 py-1">
                <p className="text-sm font-semibold text-[#202124]">
                  {getUserDisplayName(user)}
                </p>
                <p className="text-xs text-[#5f6368] truncate">{getUserEmail(user)}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#e0e0e0]" />
            <DropdownMenuItem
              id="logout-button"
              onClick={onLogout}
              className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
