'use client';

import { useState } from 'react';
import { FolderPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiCreateFolder } from '@/lib/api';

interface NewFolderModalProps {
  open: boolean;
  onClose: () => void;
  parentId: string | null;
  onCreated: () => void;
}

export default function NewFolderModal({
  open,
  onClose,
  parentId,
  onCreated,
}: NewFolderModalProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      await apiCreateFolder({ name: name.trim(), parentId });
      setName('');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setName('');
          setError('');
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm border-[#dadce0] bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f3f4]">
              <FolderPlus className="h-5 w-5 text-[#5f6368]" />
            </div>
            <DialogTitle className="text-lg font-semibold text-[#202124]">
              New folder
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#5f6368]">
            Enter folder name
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="new-folder-name"
            placeholder="Untitled folder"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="border-[#dadce0] bg-white text-[#202124] focus:ring-[#1a73e8]"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
            >
              Cancel
            </Button>
            <Button
              id="create-folder-submit"
              type="submit"
              disabled={!name.trim() || loading}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
