const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function generateSuratNumber(requestId: number, createdAt: Date | string): string {
  const d = new Date(createdAt);
  const num = String(requestId).padStart(3, '0');
  const month = ROMAN[d.getMonth()];
  const year = d.getFullYear();
  return `${num}/SPP/UKDW/${month}/${year}`;
}

export function fmtSuratDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  if (sameDay) {
    return `${s.toLocaleDateString('id-ID', dateOpts)}, ${s.toLocaleTimeString('id-ID', timeOpts)} – ${e.toLocaleTimeString('id-ID', timeOpts)} WIB`;
  }
  return `${s.toLocaleDateString('id-ID', dateOpts)} ${s.toLocaleTimeString('id-ID', timeOpts)} s.d. ${e.toLocaleDateString('id-ID', dateOpts)} ${e.toLocaleTimeString('id-ID', timeOpts)} WIB`;
}

export function fmtSuratLongDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
