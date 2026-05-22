'use client';

import { useEffect, useState } from 'react';
import { DatePicker } from '@/components/forms/DatePicker';
import { TimePicker } from '@/components/forms/TimePicker';

function splitDateTime(v: string): { date: string; time: string } {
  if (!v) return { date: '', time: '' };
  const [date, time] = v.split('T');
  return { date: date ?? '', time: (time ?? '').slice(0, 5) };
}

function joinDateTime(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time}`;
}

export function DateTimePicker({
  value,
  onChange,
  min,
  name,
  required,
  datePlaceholder = 'Pilih tanggal',
  timePlaceholder = 'Pilih jam',
  inline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  name?: string;
  required?: boolean;
  datePlaceholder?: string;
  timePlaceholder?: string;
  /** Render popup picker inline (di dalam Dialog/modal). */
  inline?: boolean;
}) {
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('');

  useEffect(() => {
    const { date, time } = splitDateTime(value);
    setDatePart(date);
    setTimePart(time);
  }, [value]);

  const minParts = splitDateTime(min ?? '');
  const minDate = minParts.date || undefined;
  const minTime =
    datePart && minParts.date && datePart === minParts.date ? minParts.time : undefined;

  const hiddenValue = joinDateTime(datePart, timePart);

  function updateDate(d: string) {
    setDatePart(d);
    onChange(joinDateTime(d, timePart));
  }

  function updateTime(t: string) {
    setTimePart(t);
    onChange(joinDateTime(datePart, t));
  }

  return (
    <div className="space-y-2">
      {name && <input type="hidden" name={name} value={hiddenValue} required={required} />}
      <DatePicker
        value={datePart}
        onChange={updateDate}
        min={minDate}
        placeholder={datePlaceholder}
        inline={inline}
      />
      <TimePicker
        value={timePart}
        onChange={updateTime}
        min={minTime}
        placeholder={timePlaceholder}
        disabled={!datePart}
        inline={inline}
      />
      {!datePart && (
        <p className="text-[11px] text-[var(--neutral-500)]">Pilih tanggal terlebih dahulu, lalu jam.</p>
      )}
    </div>
  );
}
