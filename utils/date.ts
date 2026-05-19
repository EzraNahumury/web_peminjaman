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
