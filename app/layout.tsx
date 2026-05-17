import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Peminjaman Fasilitas Kampus',
  description: 'Pengajuan peminjaman fasilitas kampus dengan approval chain.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900 flex flex-col">{children}</body>
    </html>
  );
}
