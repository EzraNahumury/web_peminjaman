'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileCheck2, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { removeSignedLetter, uploadSignedLetter } from '@/app/actions/requests';

export function SignedLetterUploader({
  requestId,
  currentUrl,
}: {
  requestId: number;
  currentUrl: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [file, setFile] = useState<File | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.error('Pilih file surat dulu');
      return;
    }
    const fd = new FormData();
    fd.append('letter', file);
    start(async () => {
      const res = await uploadSignedLetter(requestId, fd);
      if (res.error) {
        toast.error('Gagal upload', { description: res.error });
        return;
      }
      toast.success('Surat berhasil diunggah', { description: 'Admin Unit akan meninjau surat Anda.' });
      setFile(null);
      router.refresh();
    });
  }

  function handleRemove() {
    if (!confirm('Hapus surat yang sudah diunggah?')) return;
    start(async () => {
      await removeSignedLetter(requestId);
      toast.success('Surat dihapus');
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
      <div className="border-b border-[var(--neutral-100)] px-6 py-4">
        <h2 className="text-sm font-semibold text-[var(--neutral-900)]">Upload Surat yang Sudah Divalidasi</h2>
        <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
          Setelah surat ditandatangani, unggah scan/PDF di sini. Admin Unit akan meninjau surat sebelum
          menyetujui.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {currentUrl ? (
          <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--primary-200)] bg-[var(--primary-50)]/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--primary-700)] ring-1 ring-[var(--primary-200)]">
                <FileCheck2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--neutral-900)]">Surat sudah diunggah</p>
                <p className="text-xs text-[var(--neutral-600)]">
                  Menunggu peninjauan Admin Unit. Anda dapat mengganti file jika diperlukan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={currentUrl}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3 text-xs font-medium text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)]"
              >
                <FileText size={14} />
                Lihat
              </Link>
              <Button type="button" variant="outline" size="sm" onClick={handleRemove} disabled={pending}>
                <Trash2 size={14} />
                Hapus
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-4 text-center text-xs text-[var(--neutral-500)]">
            Belum ada surat terunggah. Silakan unduh surat, tandatangani, lalu upload kembali di sini.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] p-4 transition-colors hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--neutral-600)] ring-1 ring-[var(--neutral-200)]">
              <Upload size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--neutral-800)]">
                {file ? file.name : 'Pilih file surat'}
              </p>
              <p className="text-xs text-[var(--neutral-500)]">PDF / PNG / JPG / WEBP, maks 5 MB</p>
            </div>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !file}>
              <Upload size={14} />
              {pending ? 'Mengunggah…' : currentUrl ? 'Ganti Surat' : 'Unggah Surat'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
