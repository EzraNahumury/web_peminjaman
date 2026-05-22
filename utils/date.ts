const ID_TIMEZONE = 'Asia/Jakarta';

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: ID_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

const DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: ID_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: ID_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
};

export function formatWIB(d: Date | string): string {
  return new Date(d).toLocaleString('id-ID', DATETIME_OPTS) + ' WIB';
}

export function formatWIBDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('id-ID', DATE_OPTS);
}

export function formatWIBTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString('id-ID', TIME_OPTS);
}

export function nowWIB(): Date {
  return new Date();
}

function wibParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ID_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** Tanggal hari ini (WIB) dalam format yyyy-mm-dd */
export function todayDateISO(): string {
  const { year, month, day } = wibParts();
  return `${year}-${month}-${day}`;
}

/** Jam sekarang (WIB) dalam format HH:mm */
export function nowTimeISO(): string {
  const { hour, minute } = wibParts();
  return `${hour}:${minute}`;
}

/** Awal hari ini menurut WIB (untuk validasi server) */
export function startOfTodayWIB(): Date {
  const { year, month, day } = wibParts();
  return new Date(`${year}-${month}-${day}T00:00:00+07:00`);
}

export function isDateBeforeToday(isoDate: string): boolean {
  if (!isoDate) return false;
  return isoDate < todayDateISO();
}
