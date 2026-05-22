'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type FloatingPanelProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  minWidth?: number;
  /** Lebar tetap — panel tidak mengikuti lebar anchor (mis. untuk kalender). */
  fixedWidth?: number;
  align?: 'start' | 'end';
  /**
   * Render inline: panel tetap menjadi anak DOM dari pemicunya (aman dari
   * focus-trap Radix Dialog) — dipakai untuk picker di dalam modal.
   * Non-inline: panel di-portal ke <body>.
   * Kedua mode memakai `position: fixed` + pengukuran via ResizeObserver,
   * sehingga panel selalu menempel tepat di anchor & tidak terpotong overflow.
   */
  inline?: boolean;
};

export function FloatingPanel({
  open,
  onClose,
  anchorRef,
  children,
  className = '',
  minWidth,
  fixedWidth,
  align = 'start',
  inline = false,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const anchor = anchorRef.current;

    function place() {
      const rect = anchor.getBoundingClientRect();
      // Anchor belum punya layout (lebar 0) — tunggu ResizeObserver / frame berikut.
      if (rect.width === 0 && rect.height === 0) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 4;
      const margin = 8;

      const width = fixedWidth ?? Math.max(minWidth ?? 0, rect.width);
      const panelH = panelRef.current?.offsetHeight ?? 0;

      const spaceBelow = vh - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      // Buka ke atas hanya jika ruang bawah kurang & ruang atas lebih lega.
      const openUp = panelH > 0 && panelH > spaceBelow && spaceAbove > spaceBelow;

      let top: number;
      let maxHeight: number;
      if (openUp) {
        maxHeight = spaceAbove;
        top = Math.max(margin, rect.top - gap - Math.min(panelH, spaceAbove));
      } else {
        maxHeight = spaceBelow;
        top = rect.bottom + gap;
      }

      let left = align === 'end' ? rect.right - width : rect.left;
      left = Math.min(left, vw - width - margin);
      left = Math.max(margin, left);

      setStyle({
        position: 'fixed',
        top,
        left,
        width,
        maxHeight: Math.max(160, maxHeight),
        overflowY: 'auto',
        zIndex: 9999,
        visibility: 'visible',
      });
    }

    place();
    // ResizeObserver: ukur ulang setelah layout benar-benar settle (memperbaiki
    // pengukuran lebar yang keliru saat panel baru mount).
    const ro = new ResizeObserver(place);
    ro.observe(anchor);
    if (panelRef.current) ro.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef, minWidth, fixedWidth, align]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !mounted) return null;

  const panel = (
    <div ref={panelRef} style={style} className={className}>
      {children}
    </div>
  );

  // Inline → anak DOM pemicu (fokus aman di dalam Radix Dialog).
  // Non-inline → portal ke body.
  return inline ? panel : createPortal(panel, document.body);
}
