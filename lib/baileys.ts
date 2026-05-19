import 'server-only';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import QRCode from 'qrcode';
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

type ConnectionState = 'idle' | 'connecting' | 'qr' | 'connected' | 'disconnected';

type WAState = {
  status: ConnectionState;
  qrDataUrl: string | null;
  qrString: string | null;
  lastError: string | null;
  connectedAt: number | null;
  phoneNumber: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __wa: { sock: WASocket | null; state: WAState; starting: boolean } | undefined;
}

const SESSION_DIR = path.join(process.cwd(), 'wa-session');

function globalStore() {
  if (!globalThis.__wa) {
    globalThis.__wa = {
      sock: null,
      starting: false,
      state: {
        status: 'idle',
        qrDataUrl: null,
        qrString: null,
        lastError: null,
        connectedAt: null,
        phoneNumber: null,
      },
    };
  }
  return globalThis.__wa;
}

function patchState(patch: Partial<WAState>) {
  const store = globalStore();
  store.state = { ...store.state, ...patch };
}

export async function getWAState(): Promise<WAState> {
  return { ...globalStore().state };
}

export async function startWA(): Promise<WAState> {
  const store = globalStore();
  if (store.starting) return store.state;
  if (store.sock && store.state.status === 'connected') return store.state;

  store.starting = true;
  patchState({ status: 'connecting', lastError: null });

  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['FASKO UKDW', 'Chrome', '1.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    store.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, scale: 6 });
        patchState({ status: 'qr', qrString: qr, qrDataUrl });
      }

      if (connection === 'open') {
        const me = sock.user;
        patchState({
          status: 'connected',
          qrDataUrl: null,
          qrString: null,
          lastError: null,
          connectedAt: Date.now(),
          phoneNumber: me?.id?.split(':')[0] ?? null,
        });
      }

      if (connection === 'close') {
        const err = lastDisconnect?.error as Boom | undefined;
        const code = err?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        patchState({
          status: 'disconnected',
          qrDataUrl: null,
          qrString: null,
          lastError: err?.message ?? null,
          connectedAt: null,
          phoneNumber: loggedOut ? null : globalStore().state.phoneNumber,
        });
        store.sock = null;
        store.starting = false;
        if (!loggedOut) {
          setTimeout(() => {
            startWA().catch(() => {});
          }, 2000);
        }
      }
    });

    store.starting = false;
    return globalStore().state;
  } catch (e) {
    const err = e as Error;
    patchState({ status: 'disconnected', lastError: err.message });
    store.starting = false;
    store.sock = null;
    return globalStore().state;
  }
}

export async function logoutWA(): Promise<void> {
  const store = globalStore();
  try {
    if (store.sock) {
      await store.sock.logout().catch(() => {});
    }
  } finally {
    store.sock = null;
    await fs.rm(SESSION_DIR, { recursive: true, force: true }).catch(() => {});
    patchState({
      status: 'idle',
      qrDataUrl: null,
      qrString: null,
      lastError: null,
      connectedAt: null,
      phoneNumber: null,
    });
  }
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (digits.startsWith('8')) digits = '62' + digits;
  if (!digits.startsWith('62')) return null;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export async function sendWhatsApp(phone: string | null | undefined, message: string): Promise<{ ok: boolean; error?: string }> {
  const store = globalStore();
  if (!store.sock || store.state.status !== 'connected') {
    return { ok: false, error: 'WhatsApp belum terhubung' };
  }
  const normalized = normalizePhone(phone);
  if (!normalized) return { ok: false, error: 'Nomor HP tidak valid' };
  const jid = `${normalized}@s.whatsapp.net`;
  try {
    await store.sock.sendMessage(jid, { text: message });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function autoBootstrapWA() {
  try {
    const exists = await fs
      .stat(path.join(SESSION_DIR, 'creds.json'))
      .then(() => true)
      .catch(() => false);
    if (exists && globalStore().state.status === 'idle') {
      await startWA();
    }
  } catch {}
}
