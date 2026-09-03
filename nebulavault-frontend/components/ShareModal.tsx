'use client';

import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiShareResource } from '@/lib/api';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'file' | 'folder';
}

export default function ShareModal({
  open,
  onClose,
  resourceId,
  resourceType,
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiShareResource({
        email: email.trim(),
        resourceId,
        resourceType,
        permission,
      });
      setSuccess(res.message || 'Shared successfully!');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPermission('viewer');
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm border-[#dadce0] bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe]">
              <UserPlus className="h-5 w-5 text-[#1a73e8]" />
            </div>
            <DialogTitle className="text-lg font-semibold text-[#202124]">
              Share {resourceType === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-[#5f6368]">
            Share with users by email address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#5f6368]" htmlFor="share-email">
              Email address
            </label>
            <Input
              id="share-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="border-[#dadce0] text-[#202124]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#5f6368]" htmlFor="share-permission">
              Permission
            </label>
            <Select
              value={permission}
              onValueChange={(v) => setPermission(v as 'viewer' | 'editor')}
            >
              <SelectTrigger id="share-permission" className="border-[#dadce0] text-[#202124]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-[#dadce0] bg-white">
                <SelectItem value="viewer">Viewer — can view only</SelectItem>
                <SelectItem value="editor">Editor — can edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
            >
              Close
            </Button>
            <Button
              id="share-submit"
              type="submit"
              disabled={!email.trim() || loading}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Share
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
