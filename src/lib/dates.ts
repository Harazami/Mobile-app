const DAY_MS = 86_400_000;

export const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const THAI_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function parseISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(ms: number, n: number): number {
  return ms + n * DAY_MS;
}

/** แปลง Date (เวลาท้องถิ่น) เป็น yyyy-mm-dd */
export function localDateToISO(n: Date): string {
  const p = (v: number) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export function todayISO(): string {
  return localDateToISO(new Date());
}

export function weekday(ms: number): number {
  return new Date(ms).getUTCDay();
}

export function isWeekend(ms: number): boolean {
  const w = weekday(ms);
  return w === 0 || w === 6;
}

/** เช่น "13 เม.ย." */
export function formatShort(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${THAI_MONTHS[d.getUTCMonth()]}`;
}

/** เช่น "13 เม.ย. 70" (ปี พ.ศ. 2 หลัก) */
export function formatWithYear(ms: number): string {
  const d = new Date(ms);
  return `${formatShort(ms)} ${String((d.getUTCFullYear() + 543) % 100).padStart(2, '0')}`;
}

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function addDaysISO(iso: string, n: number): string {
  return toISO(addDays(parseISO(iso), n));
}

/** เช่น "ธันวาคม 2569" */
export function monthTitle(year: number, month: number): string {
  return `${THAI_MONTHS_FULL[month]} ${year + 543}`;
}
