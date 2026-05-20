'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import LandingLoginForm from './LandingLoginForm';

const YEAR = new Date().getFullYear();

export default function LandingShell() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--neutral-50)] lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      <LeftPanel />
      <RightPanel />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Left panel — clean minimalist hero                                  */
/* ------------------------------------------------------------------ */

function LeftPanel() {
  return (
    <section
      className="relative hidden flex-col justify-between overflow-hidden px-12 py-12 text-white lg:flex xl:px-16"
      style={{
        background:
          'linear-gradient(180deg, #062818 0%, #0a3d23 50%, #0c4a2b 100%)',
      }}
    >
      {/* Single elegant orb */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[640px] w-[640px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(74,222,128,0.35), rgba(34,197,94,0.18) 40%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(110,231,183,0.4), transparent 65%)',
        }}
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 30% 30%, black 30%, transparent 100%)',
        }}
      />

      {/* Noise overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* === LOGO === */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex items-center gap-3"
      >
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] ring-1 ring-white/20">
          <Image src="/ukdw.png" alt="UKDW" width={36} height={36} className="h-full w-full object-contain" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-[15px] font-bold tracking-tight">FASKO</p>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <p className="text-[11px] font-medium tracking-wide text-white/55">UKDW</p>
        </div>
      </motion.div>

      {/* === HERO === */}
      <div className="relative max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11.5px] font-medium text-white/80 backdrop-blur"
        >
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </span>
          <span className="tracking-wide">Sistem Peminjaman Resmi</span>
        </motion.div>

        <AnimatedHeading />

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-7 max-w-lg text-[16px] leading-relaxed text-white/65"
        >
          Satu portal untuk seluruh fasilitas kampus. Ajukan, jadwalkan, dan dapatkan persetujuan
          tanpa perlu kertas.
        </motion.p>
      </div>

      {/* === STATS === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="relative grid max-w-xl grid-cols-3 gap-10 border-t border-white/10 pt-7"
      >
        <CountStat value={108} suffix="+" label="Fasilitas" delay={0.95} />
        <CountStat value={4.2} suffix="k" decimals={1} label="Diproses" delay={1.1} />
        <CountStat value={97} suffix="%" label="Tepat waktu" delay={1.25} />
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Right panel — login                                                 */
/* ------------------------------------------------------------------ */

function RightPanel() {
  return (
    <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-10">
      {/* Subtle dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)',
          backgroundSize: '22px 22px',
          maskImage:
            'radial-gradient(ellipse 60% 60% at 50% 30%, black 30%, transparent 100%)',
        }}
      />

      {/* Mobile brand chip */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute left-1/2 top-8 flex -translate-x-1/2 items-center gap-2 lg:hidden"
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--neutral-200)]">
          <Image src="/ukdw.png" alt="UKDW" width={28} height={28} className="h-full w-full object-contain p-1" />
        </div>
        <span className="text-sm font-bold tracking-tight text-[var(--neutral-900)]">FASKO</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[400px]"
      >
        <div className="relative rounded-[28px] border border-[var(--neutral-200)]/80 bg-white p-8 shadow-[0_2px_4px_rgba(15,23,42,0.04),0_20px_60px_-25px_rgba(15,23,42,0.18)] sm:p-9">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8"
          >
            <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary-700)]">
              <Sparkles size={11} />
              Login
            </p>
            <h2 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">
              Selamat datang
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--neutral-500)]">
              Masuk dengan akun UKDW untuk mulai mengajukan peminjaman.
            </p>
          </motion.div>

          <Suspense
            fallback={
              <div className="space-y-3">
                <div className="h-10 animate-pulse rounded-lg bg-[var(--neutral-100)]" />
                <div className="h-10 animate-pulse rounded-lg bg-[var(--neutral-100)]" />
                <div className="h-11 animate-pulse rounded-lg bg-[var(--neutral-200)]" />
              </div>
            }
          >
            <LandingLoginForm />
          </Suspense>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-7 flex items-center justify-center gap-2 text-[11.5px] text-[var(--neutral-400)]"
          >
            <ShieldCheck size={11} />
            Koneksi aman & terenkripsi
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 text-center text-[13.5px] text-[var(--neutral-600)]"
        >
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="group/link inline-flex items-center gap-0.5 font-semibold text-[var(--primary-700)] underline-offset-4 transition-colors hover:text-[var(--primary-800)] hover:underline"
          >
            Daftar Pengurus
            <ArrowRight
              size={12}
              className="transition-transform duration-200 group-hover/link:translate-x-0.5"
            />
          </Link>
        </motion.p>
      </motion.div>

      <p className="absolute bottom-5 left-0 right-0 text-center text-[11px] text-[var(--neutral-400)]">
        © {YEAR} Universitas Kristen Duta Wacana
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bits                                                                */
/* ------------------------------------------------------------------ */

function AnimatedHeading() {
  const line1 = 'Pinjam fasilitas';
  const line2 = 'kampus secepat';
  const line3 = 'kuliah berjalan.';

  return (
    <h1 className="text-balance text-[52px] font-bold leading-[1] tracking-[-0.02em] xl:text-[60px]">
      <SplitLine text={line1} delay={0.2} />
      <SplitLine text={line2} delay={0.32} />
      <span className="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-white bg-clip-text text-transparent">
        <SplitLine text={line3} delay={0.44} />
      </span>
    </h1>
  );
}

function SplitLine({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {text}
      </motion.span>
    </span>
  );
}

function CountStat({
  value,
  suffix = '',
  decimals = 0,
  label,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1.4 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => mv.set(value), delay * 1000);
      return () => clearTimeout(t);
    }
  }, [inView, value, delay, mv]);

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(v.toFixed(decimals)));
  }, [spring, decimals]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
    >
      <p className="text-[34px] font-bold leading-none tracking-tight tabular-nums">
        {display}
        <span className="text-emerald-300">{suffix}</span>
      </p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
    </motion.div>
  );
}
