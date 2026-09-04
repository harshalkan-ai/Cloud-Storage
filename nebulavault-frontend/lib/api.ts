import { File, Folder, SharePayload, TrashResponse, UploadTicket, User } from '@/types';

const API_BASE = 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Custom error for auth issues (non-crashing)
class AuthError extends Error {
  constructor(msg = 'Authentication required') {
    super(msg);
    this.name = 'AuthError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  // If no token on a protected endpoint, throw a silent AuthError.
  // The dashboard layout handles this by showing the loading state
  // until useAuth finishes, so this only fires during brief race windows.
  if (!token && !endpoint.startsWith('/auth')) {
    throw new AuthError();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));

      // On 401, clear token and redirect to login
      if (res.status === 401 && !endpoint.startsWith('/auth')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        throw new AuthError('Session expired');
      }

      console.error(`[API Error] ${options.method || 'GET'} ${url} -> Status ${res.status}:`, err);
      throw new Error(err.error || `HTTP error ${res.status}`);
    }

    return res.json();
  } catch (error: any) {
    if (!(error instanceof AuthError)) {
      console.error(`[Network Error] ${url}:`, error);
    }
    throw error;
  }
}

export function isAuthError(e: unknown): boolean {
  return e instanceof Error && e.name === 'AuthError';
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function apiRegister(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ token: string; user: User }> {
  const res = await request<{ token?: string; user?: User; message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (res.token && res.user) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    return { token: res.token, user: res.user };
  }

  return apiLogin({ email: data.email, password: data.password });
}

export async function apiLogin(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const res = await request<{ token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (res.token) {
    localStorage.setItem('token', res.token);
    if (res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
    }
  }

  return res;
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export async function apiFetchFolders(params: {
  parentId?: string | null;
  search?: string;
}): Promise<{ folders: Folder[] }> {
  const q = new URLSearchParams();
  if (params.parentId) q.set('parentId', params.parentId);
  if (params.search) q.set('search', params.search);
  return request(`/folders?${q.toString()}`);
}

export async function apiCreateFolder(data: {
  name: string;
  parentId?: string | null;
}): Promise<{ folder: Folder }> {
  return request('/folders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Files ───────────────────────────────────────────────────────────────────

export async function apiFetchFiles(params: {
  folderId?: string | null;
  search?: string;
  starred?: boolean;
}): Promise<{ files: File[] }> {
  const q = new URLSearchParams();
  if (params.folderId) q.set('folderId', params.folderId);
  if (params.search) q.set('search', params.search);
  if (params.starred) q.set('starred', 'true');
  return request(`/files?${q.toString()}`);
}

export function apiUploadDirect(
  file: globalThis.File,
  folderId?: string | null,
  onProgress?: (percent: number) => void
): Promise<{ message: string; file: File }> {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/files/upload`);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          resolve({ message: 'Success', file: {} as any });
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

export async function apiGetUploadTicket(data: {
  fileName: string;
  folderId?: string | null;
  fileSize: number;
  fileType: string;
}): Promise<UploadTicket> {
  return request('/files/upload-ticket', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUploadToStorage(
  uploadUrl: string,
  file: globalThis.File
): Promise<void> {
  // IMPORTANT: Do NOT add Authorization header to Supabase presigned PUT URLs
  // The signed URL already contains auth credentials in the query string.
  // Adding Authorization header causes signature mismatch errors.
  try {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[Storage Upload] HTTP ${res.status}:`, text);
      throw new Error(`Upload failed with status ${res.status}`);
    }
  } catch (err) {
    console.error('[Storage Upload Error]', err);
    throw err;
  }
}

export async function apiGetFileViewUrl(id: string): Promise<{ url: string }> {
  return request(`/files/view/${id}`);
}

export async function apiToggleStar(
  id: string,
  isStarred: boolean
): Promise<{ file: File }> {
  return request(`/files/star/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isStarred }),
  });
}

// ─── Shares ──────────────────────────────────────────────────────────────────

export async function apiShareResource(
  data: SharePayload
): Promise<{ message: string }> {
  return request('/shares', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Trash ───────────────────────────────────────────────────────────────────

export async function apiFetchTrash(): Promise<TrashResponse> {
  return request('/trash');
}

export async function apiMoveToTrash(
  id: string,
  resourceType: 'file' | 'folder'
): Promise<{ message: string }> {
  return request(`/trash/move/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ resourceType }),
  });
}

export async function apiRestoreFromTrash(
  id: string,
  resourceType: 'file' | 'folder'
): Promise<{ message: string }> {
  return request(`/trash/restore/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ resourceType }),
  });
}
