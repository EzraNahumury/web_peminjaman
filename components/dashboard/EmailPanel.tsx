'use client';
import { useState, useTransition } from 'react';
import { Loader2, Mail, Send, ShieldAlert, ShieldCheck, ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { sendTestEmail, verifyEmailConnection } from '@/app/actions/mailer';

type MailerState = {
  enabled: boolean;
  host: string | null;
  from: string | null;
  lastError: string | null;
};

export function EmailPanel({ initial }: { initial: MailerState }) {
  const [state, setState] = useState<MailerState>(initial);
  const [testEmail, setTestEmail] = useState('');
  const [verifying, startVerify] = useTransition();
  const [sending, startSend] = useTransition();

  function handleVerify() {
    startVerify(async () => {
      const res = await verifyEmailConnection();
      if (res.ok) {
        toast.success('SMTP terverifikasi', { description: 'Koneksi ke server email berhasil.' });
        setState((s) => ({ ...s, enabled: true, lastError: null }));
      } else {
        toast.error('Verifikasi gagal', { description: res.error });
        setState((s) => ({ ...s, lastError: res.error ?? null }));
      }
    });
  }

  function handleTest() {
    if (!testEmail.trim()) {
      toast.error('Masukkan email tujuan');
      return;
    }
    startSend(async () => {
      const res = await sendTestEmail(testEmail.trim());
      if (res.ok) {
        toast.success('Email tes terkirim', { description: `Cek inbox ${testEmail}` });
        setTestEmail('');
      } else {
        toast.error('Gagal kirim', { description: res.error ?? 'Tidak diketahui' });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6 shadow-[var(--shadow-xs)] lg:col-span-1">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] ${
              state.enabled
                ? 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
            }`}
          >
            {state.enabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[12px] font-medium text-[var(--neutral-500)]">Status SMTP</p>
            <p className="text-base font-semibold tracking-tight text-[var(--neutral-900)]">
              {state.enabled ? 'Terkonfigurasi' : 'Belum aktif'}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">Host</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[var(--neutral-900)]">
              <ServerCog className="h-4 w-4 text-[var(--neutral-500)]" />
              {state.host ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">Pengirim</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[var(--neutral-900)]">
              <Mail className="h-4 w-4 text-[var(--neutral-500)]" />
              {state.from ?? '—'}
            </dd>
          </div>
          {state.lastError && (
            <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <p className="font-semibold">Error terakhir</p>
              <p className="mt-1 break-words">{state.lastError}</p>
            </div>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={handleVerify} disabled={verifying} variant="primary">
            {verifying ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Verifikasi Koneksi
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6 shadow-[var(--shadow-xs)] lg:col-span-2">
        {state.enabled ? (
          <div className="flex flex-col gap-6 py-2">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[var(--neutral-900)]">Email terkonfigurasi</h3>
              <p className="mt-1 max-w-md text-sm text-[var(--neutral-600)]">
                Notifikasi approval/penolakan akan otomatis dikirim ke alamat email pengaju.
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
              <p className="text-sm font-semibold text-[var(--neutral-900)]">Tes kirim email</p>
              <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
                Masukkan alamat email tujuan untuk verifikasi pengiriman.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="alamat@email.com"
                />
                <Button onClick={handleTest} disabled={sending}>
                  {sending ? <Loader2 className="animate-spin" /> : <Send />}
                  Kirim tes
                </Button>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--primary-100)] bg-[var(--primary-50)]/60 p-4 text-xs text-[var(--primary-800)]">
              <p className="font-semibold">Cara kerja otomatis</p>
              <ul className="mt-1.5 space-y-1 leading-relaxed">
                <li>• Email terkirim bersamaan dengan notifikasi WA + in-app saat approval chain berjalan.</li>
                <li>• Staff (Biro III, WR3/WD3, Admin Unit) hanya menerima notifikasi in-app, tidak email blast.</li>
                <li>• Kegagalan email tidak menggagalkan transaksi utama (fire-and-forget).</li>
                <li>• Header email menggunakan brand FASKO dengan tombol &ldquo;Buka detail&rdquo;.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--neutral-100)] text-[var(--neutral-500)]">
              <Mail className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">SMTP belum dikonfigurasi</h3>
            <p className="max-w-md text-sm text-[var(--neutral-600)]">
              Tambahkan variabel berikut ke <code className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 text-xs">.env.local</code>{' '}
              lalu restart server: <code className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 text-xs">SMTP_HOST</code>,{' '}
              <code className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 text-xs">SMTP_PORT</code>,{' '}
              <code className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 text-xs">SMTP_USER</code>,{' '}
              <code className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 text-xs">SMTP_PASS</code>,{' '}
              <code className="rounded bg-[var(--neutral-100)] px-1.5 py-0.5 text-xs">SMTP_FROM</code>.
            </p>
            <div className="mt-4 max-w-md rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4 text-left text-xs text-[var(--neutral-700)]">
              <p className="font-semibold text-[var(--neutral-900)]">Contoh Gmail App Password</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] leading-relaxed">{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=akun@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM="FASKO UKDW" <akun@gmail.com>`}</pre>
              <p className="mt-2">
                Buat App Password di{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--primary-700)] underline-offset-2 hover:underline"
                >
                  myaccount.google.com/apppasswords
                </a>{' '}
                (perlu 2FA aktif).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
