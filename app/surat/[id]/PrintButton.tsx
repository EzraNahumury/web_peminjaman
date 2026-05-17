'use client';

export function PrintButton() {
  return (
    <button className="surat-btn" onClick={() => window.print()}>
      Cetak / Unduh PDF
    </button>
  );
}
