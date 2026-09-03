import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImage(type: string, name: string): boolean {
  return (
    type.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
      getFileExtension(name)
    )
  );
}

export function isPdf(type: string, name: string): boolean {
  return type === 'application/pdf' || getFileExtension(name) === 'pdf';
}

export function getFileColorClass(type: string, name: string): string {
  const ext = getFileExtension(name);
  if (type.startsWith('image/')) return 'text-emerald-400';
  if (type === 'application/pdf' || ext === 'pdf') return 'text-red-400';
  if (
    type.includes('spreadsheet') ||
    type.includes('excel') ||
    ext === 'xlsx' ||
    ext === 'csv'
  )
    return 'text-green-400';
  if (
    type.includes('document') ||
    type.includes('word') ||
    ext === 'docx' ||
    ext === 'doc'
  )
    return 'text-blue-400';
  if (
    type.includes('presentation') ||
    type.includes('powerpoint') ||
    ext === 'pptx'
  )
    return 'text-orange-400';
  if (type.includes('video/')) return 'text-purple-400';
  if (type.includes('audio/')) return 'text-pink-400';
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    ext === 'zip' ||
    ext === 'rar'
  )
    return 'text-yellow-400';
  if (
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('json') ||
    ext === 'js' ||
    ext === 'ts' ||
    ext === 'json'
  )
    return 'text-cyan-400';
  return 'text-zinc-400';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
