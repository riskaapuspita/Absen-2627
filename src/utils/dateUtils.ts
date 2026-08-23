// Indonesian date formatting helpers

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function formatIndonesianDate(dateStr: string | Date, withDay = true): string {
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : '')) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);

    const dayName = INDONESIAN_DAYS[d.getDay()];
    const dayNumber = d.getDate();
    const monthName = INDONESIAN_MONTHS[d.getMonth()];
    const year = d.getFullYear();

    if (withDay) {
      return `${dayName}, ${dayNumber} ${monthName} ${year}`;
    }
    return `${dayNumber} ${monthName} ${year}`;
  } catch {
    return String(dateStr);
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = INDONESIAN_MONTHS[d.getMonth()].substring(0, 3);
    return `${day} ${month}`;
  } catch {
    return dateStr;
  }
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRangePresets(): {
  today: { start: string; end: string };
  thisWeek: { start: string; end: string };
  thisMonth: { start: string; end: string };
  thisSemester: { start: string; end: string };
} {
  const today = new Date();
  const todayStr = getTodayString();

  // This week (Monday to Friday/Sunday)
  const currentDay = today.getDay(); // 0 = Sun, 1 = Mon
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const formatD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // This month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // This semester (e.g. July - Dec for Ganjil, Jan - June for Genap)
  const isGanjil = today.getMonth() >= 6; // July (6) to Dec (11)
  const semesterStart = isGanjil
    ? new Date(today.getFullYear(), 6, 1)
    : new Date(today.getFullYear(), 0, 1);
  const semesterEnd = isGanjil
    ? new Date(today.getFullYear(), 11, 31)
    : new Date(today.getFullYear(), 5, 30);

  return {
    today: { start: todayStr, end: todayStr },
    thisWeek: { start: formatD(monday), end: todayStr },
    thisMonth: { start: formatD(firstOfMonth), end: formatD(lastOfMonth) },
    thisSemester: { start: formatD(semesterStart), end: formatD(semesterEnd) },
  };
}
