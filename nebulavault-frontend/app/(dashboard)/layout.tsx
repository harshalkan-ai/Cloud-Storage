'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import NewFolderModal from '@/components/NewFolderModal';
import UploadModal from '@/components/UploadModal';
import { useAuth } from '@/hooks/useAuth';

interface DashboardContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  triggerRefresh: () => void;
  refreshKey: number;
}

const DashboardContext = createContext<DashboardContextType>({
  searchTerm: '',
  setSearchTerm: () => {},
  triggerRefresh: () => {},
  refreshKey: 0,
});

export const useDashboardContext = () => useContext(DashboardContext);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  // Once auth finishes loading and user is confirmed, trigger an initial data fetch
  useEffect(() => {
    if (!loading && user) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [loading, user]);

  // Show loading spinner until auth is resolved
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-3 text-[#5f6368]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
        <p className="text-sm font-medium">Opening Drive...</p>
      </div>
    );
  }

  // If auth resolved but no user, useAuth will have already redirected to /login
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-3 text-[#5f6368]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a73e8]" />
        <p className="text-sm font-medium">Redirecting...</p>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ searchTerm, setSearchTerm, triggerRefresh, refreshKey }}>
      <div className="min-h-screen bg-white text-[#202124] flex flex-col">
        <Navbar user={user} onSearch={setSearchTerm} onLogout={logout} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            onNewFolder={() => setIsNewFolderOpen(true)}
            onUploadFile={() => setIsUploadOpen(true)}
            refreshKey={refreshKey}
          />
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            {children}
          </main>
        </div>
      </div>

      <NewFolderModal
        open={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        parentId={null}
        onCreated={triggerRefresh}
      />

      <UploadModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        folderId={null}
        onUploaded={triggerRefresh}
      />
    </DashboardContext.Provider>
  );
}
