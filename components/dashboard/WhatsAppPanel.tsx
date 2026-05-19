'use client';
import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { Loader2, Smartphone, RefreshCcw, Plug, PlugZap, ShieldCheck, ShieldAlert, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppStatus,
  sendTestWhatsApp,
} from '@/app/actions/whatsapp';

type WAState = {
  status: 'idle' | 'connecting' | 'qr' | 'connected' | 'disconnected';
  qrDataUrl: string | null;
  qrString: string | null;
  lastError: string | null;
  connectedAt: number | null;
  phoneNumber: string | null;
};

const STATUS_LABEL: Record<WAState['status'], string> = {
  idle: 'Belum dimulai',
  connecting: 'Menghubungkan…',
  qr: 'Menunggu pemindaian QR',
  connected: 'Terhubung',
  disconnected: 'Terputus',
};

export function WhatsAppPanel({ initial }: { initial: WAState }) {
  const [state, setState] = useState<WAState>(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (state.status === 'qr' || state.status === 'connecting') {
      const id = setInterval(async () => {
        const next = await getWhatsAppStatus();
        setState(next);
      }, 2000);
      return () => clearInterval(id);
    }
  }, [state.status]);

  function handleConnect() {
    start(async () => {
      const next = await connectWhatsApp();
      setState(next);
      toast.success('Memulai sesi WhatsApp', { description: 'Tunggu QR code muncul lalu pindai dengan HP Anda.' });
    });
  }

  function handleDisconnect() {
    if (!confirm('Putuskan sesi WhatsApp? Anda perlu memindai QR lagi untuk menghubungkan kembali.')) return;
    start(async () => {
      await disconnectWhatsApp();
      const next = await getWhatsAppStatus();
      setState(next);
      toast.success('Sesi WhatsApp dihentikan');
    });
  }

  async function handleRefresh() {
    const next = await getWhatsAppStatus();
    setState(next);
  }

  const isConnected = state.status === 'connected';
  const showQR = state.status === 'qr' && state.qrDataUrl;
  const showSpinner = state.status === 'connecting';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6 shadow-[var(--shadow-xs)] lg:col-span-1">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] ${
              isConnected
                ? 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]'
                : state.status === 'disconnected'
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
            }`}
          >
            {isConnected ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-[12px] font-medium text-[var(--neutral-500)]">Status koneksi</p>
            <p className="text-base font-semibold tracking-tight text-[var(--neutral-900)]">
              {STATUS_LABEL[state.status]}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">
              Nomor terhubung
            </dt>
            <dd className="mt-0.5 flex items-center gap-1.5 text-[var(--neutral-900)]">
              <Smartphone className="h-4 w-4 text-[var(--neutral-500)]" />
              {state.phoneNumber ? `+${state.phoneNumber}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">
              Terhubung sejak
            </dt>
            <dd className="mt-0.5 text-[var(--neutral-900)]">
              {state.connectedAt ? new Date(state.connectedAt).toLocaleString('id-ID') : '—'}
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
          {!isConnected && (
            <Button onClick={handleConnect} disabled={pending} variant="primary">
              {pending ? <Loader2 className="animate-spin" /> : <Plug />}
              {state.status === 'idle' ? 'Mulai koneksi' : 'Hubungkan ulang'}
            </Button>
          )}
          {isConnected && (
            <Button onClick={handleDisconnect} disabled={pending} variant="danger">
              <PlugZap />
              Putuskan
            </Button>
          )}
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCcw />
            Segarkan
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6 shadow-[var(--shadow-xs)] lg:col-span-2">
        {showQR ? (
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center gap-2 text-sm text-[var(--neutral-700)]">
              <QrCode className="h-4 w-4" />
              Pindai dengan aplikasi <span className="font-semibold text-[var(--neutral-900)]">WhatsApp</span> di HP
              admin.
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-3 shadow-[var(--shadow-sm)]">
              <Image
                src={state.qrDataUrl!}
                alt="QR WhatsApp"
                width={300}
                height={300}
                unoptimized
                className="h-[300px] w-[300px]"
              />
            </div>
            <ol className="max-w-md space-y-1.5 text-xs text-[var(--neutral-600)]">
              <li>1. Buka WhatsApp di HP yang akan dijadikan akun pengirim FASKO.</li>
              <li>2. Tap menu titik tiga → <strong>Perangkat tertaut</strong> → <strong>Tautkan perangkat</strong>.</li>
              <li>3. Arahkan kamera ke QR di atas. Sesi akan otomatis aktif.</li>
            </ol>
          </div>
        ) : showSpinner ? (
          <div className="flex h-[360px] flex-col items-center justify-center gap-3 text-sm text-[var(--neutral-600)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-700)]" />
            Memulai sesi…
          </div>
        ) : isConnected ? (
          <ConnectedPanel phoneNumber={state.phoneNumber} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--neutral-100)] text-[var(--neutral-500)]">
              <QrCode className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--neutral-900)]">Belum ada sesi WhatsApp</h3>
            <p className="max-w-md text-sm text-[var(--neutral-600)]">
              Klik <strong>Mulai koneksi</strong> untuk menampilkan QR code. Sesi disimpan lokal di server
              dan dapat dipakai ulang sampai diputuskan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectedPanel({ phoneNumber }: { phoneNumber: string | null }) {
  const [testPhone, setTestPhone] = useState('');
  const [sending, startSend] = useTransition();

  function handleTest() {
    if (!testPhone.trim()) {
      toast.error('Masukkan nomor tujuan');
      return;
    }
    startSend(async () => {
      const res = await sendTestWhatsApp(testPhone.trim());
      if (res.ok) {
        toast.success('Pesan tes terkirim', { description: `Cek WA di ${testPhone}` });
        setTestPhone('');
      } else {
        toast.error('Gagal kirim', { description: res.error ?? 'Tidak diketahui' });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-[var(--neutral-900)]">WhatsApp terhubung</h3>
        <p className="mt-1 max-w-md text-sm text-[var(--neutral-600)]">
          Notifikasi approval/penolakan otomatis dikirim ke nomor pengaju di kolom &quot;No HP&quot; profil mereka.
        </p>
        {phoneNumber && (
          <p className="mt-1 text-xs text-[var(--neutral-500)]">
            Akun pengirim:{' '}
            <span className="font-mono font-semibold text-[var(--neutral-800)]">+{phoneNumber}</span>
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
        <p className="text-sm font-semibold text-[var(--neutral-900)]">Tes kirim pesan</p>
        <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
          Masukkan nomor tujuan (format <span className="font-mono">08xxxxxxxxxx</span> atau{' '}
          <span className="font-mono">62xxxxxxxxxx</span>) untuk verifikasi koneksi.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="082338142821"
            type="tel"
          />
          <Button onClick={handleTest} disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : <Smartphone />}
            Kirim tes
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--primary-100)] bg-[var(--primary-50)]/60 p-4 text-xs text-[var(--primary-800)]">
        <p className="font-semibold">Cara kerja otomatis</p>
        <ul className="mt-1.5 space-y-1 leading-relaxed">
          <li>• Saat Biro III / WR3 / WD3 / Admin Unit menyetujui atau menolak pengajuan, pengaju otomatis menerima WA.</li>
          <li>• Sistem normalisasi nomor: <span className="font-mono">08xxx</span> → <span className="font-mono">62xxx</span>.</li>
          <li>• Nomor tidak valid / kosong akan dilewati tanpa error.</li>
          <li>• Sesi tersimpan; reconnect otomatis saat server restart.</li>
        </ul>
      </div>
    </div>
  );
}
