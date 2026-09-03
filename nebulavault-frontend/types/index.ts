export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface AuthState {
  token: string;
  user: User;
}

export interface Folder {
  id: string;
  name: string;
  owner_id: string;
  parent_id: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface File {
  id: string;
  name: string;
  storage_path: string;
  owner_id: string;
  folder_id: string | null;
  size: number;
  type: string;
  is_starred: boolean;
  is_deleted: boolean;
  created_at: string;
}

export interface UploadTicket {
  uploadUrl: string;
  path: string;
  file: File;
}

export interface SharePayload {
  email: string;
  resourceId: string;
  resourceType: 'file' | 'folder';
  permission: 'viewer' | 'editor';
}

export interface TrashResponse {
  trashedFolders: Folder[];
  trashedFiles: File[];
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}
