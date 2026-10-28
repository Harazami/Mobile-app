import { addDaysISO, formatShort, formatWithYear, parseISO } from './dates';

export type DateRange = { start: string; end: string };

export function normalizeRange(a: string, b: string): DateRange {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export function expandRange({ start, end }: DateRange): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDaysISO(d, 1)) out.push(d);
  return out;
}

export function inRanges(iso: string, ranges: DateRange[]): boolean {
  return ranges.some((r) => iso >= r.start && iso <= r.end);
}

/** เช่น "5 ธ.ค. 69" หรือ "5 ธ.ค. – 13 ธ.ค. 69" */
export function formatRange({ start, end }: DateRange): string {
  if (start === end) return formatWithYear(parseISO(start));
  return `${formatShort(parseISO(start))} – ${formatWithYear(parseISO(end))}`;
}

export type HolidayGroup = DateRange & { name: string; days: string[] };

/** รวมวันหยุดที่ติดกันและชื่อเดียวกันเป็นช่วงเดียว (ไว้แสดงผล/ลบทีละช่วง) */
export function groupHolidays(map: Record<string, string>): HolidayGroup[] {
  const groups: HolidayGroup[] = [];
  for (const iso of Object.keys(map).sort()) {
    const last = groups[groups.length - 1];
    if (last && last.name === map[iso] && addDaysISO(last.end, 1) === iso) {
      last.end = iso;
      last.days.push(iso);
    } else {
      groups.push({ start: iso, end: iso, name: map[iso], days: [iso] });
    }
  }
  return groups;
}
