import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FASKO — Peminjaman Fasilitas Kampus UKDW',
  description: 'Sistem digital peminjaman fasilitas Universitas Kristen Duta Wacana.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-[var(--neutral-50)] text-[var(--neutral-900)] antialiased">
        {children}
      </body>
    </html>
  );
}
