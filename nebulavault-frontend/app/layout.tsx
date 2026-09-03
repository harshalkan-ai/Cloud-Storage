import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NebulaVault — Cloud Storage',
  description:
    'NebulaVault is a secure, fast, and beautiful cloud storage solution. Store, organize, and share your files with ease.',
  keywords: ['cloud storage', 'file manager', 'secure storage', 'NebulaVault'],
  authors: [{ name: 'NebulaVault' }],
  openGraph: {
    title: 'NebulaVault — Cloud Storage',
    description: 'Secure cloud storage for all your files.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>{children}</body>
    </html>
  );
}
