import { addDays, isWeekend, parseISO, toISO } from './dates';
import { DateRange, inRanges } from './ranges';

export type DayKind = 'work' | 'weekend' | 'holiday';

export type Day = {
  ms: number;
  iso: string;
  kind: DayKind;
  holidayName?: string;
  /** วันทำงานที่ต้องลาในช่วงนี้ */
  isLeave: boolean;
};

export type Suggestion = {
  /** ไม่ซ้ำกัน: วันเริ่ม_วันจบ */
  id: string;
  start: number;
  end: number;
  totalDays: number;
  leaveDays: number;
  /** วันหยุดรวม ต่อวันลา 1 วัน */
  efficiency: number;
  days: Day[];
};

export function classify(ms: number, holidays: Record<string, string>): { kind: DayKind; name?: string } {
  const iso = toISO(ms);
  if (holidays[iso]) return { kind: 'holiday', name: holidays[iso] };
  if (isWeekend(ms)) return { kind: 'weekend' };
  return { kind: 'work' };
}

/**
 * หาแผนลาที่ได้หยุดต่อเนื่อง โดยใช้วันลาไม่เกิน leaveBudget วัน
 * - ช่วงต้องยาวสุดทั้งสองฝั่ง (วันก่อน/หลังช่วงเป็นวันทำงาน) และมีวันหยุดอยู่ในช่วงด้วย
 * - ถ้าระบุ preferred วันลาทุกวันต้องอยู่ในช่วงที่อยากลา
 * - แผนที่ทับกันจะเก็บไว้เฉพาะที่คุ้มกว่า (หยุดยาวกว่า หรือใช้วันลาน้อยกว่า)
 */
export function findSuggestions(
  fromISO: string,
  toISOStr: string,
  holidays: Record<string, string>,
  leaveBudget: number,
  preferred: DateRange[] = [],
): Suggestion[] {
  const from = parseISO(fromISO);
  const to = parseISO(toISOStr);
  const total = Math.round((to - from) / 86_400_000) + 1;
  if (total <= 0 || leaveBudget < 1) return [];

  const days: Day[] = [];
  for (let i = 0; i < total; i++) {
    const ms = addDays(from, i);
    const c = classify(ms, holidays);
    days.push({ ms, iso: toISO(ms), kind: c.kind, holidayName: c.name, isLeave: false });
  }
  const off = (i: number) => days[i].kind !== 'work';

  const candidates: Suggestion[] = [];
  for (let s = 0; s < total; s++) {
    if (s > 0 && off(s - 1)) continue;
    let used = 0;
    for (let e = s; e < total; e++) {
      if (!off(e)) {
        used++;
        if (used > leaveBudget) break;
      }
      const maximal = e === total - 1 || !off(e + 1);
      if (!maximal || used === 0 || e - s + 1 === used) continue;
      const slice = days.slice(s, e + 1).map((d) => ({ ...d, isLeave: d.kind === 'work' }));
      const sug: Suggestion = {
        id: `${slice[0].iso}_${slice[slice.length - 1].iso}`,
        start: slice[0].ms,
        end: slice[slice.length - 1].ms,
        totalDays: slice.length,
        leaveDays: used,
        efficiency: slice.length / used,
        days: slice,
      };
      if (leaveWithin(sug, preferred)) candidates.push(sug);
    }
  }

  // เรียงจากดีสุด แล้วตัดแผนที่ทับกับแผนที่ดีกว่าและไม่ได้ประหยัดวันลากว่า
  candidates.sort((a, b) => b.totalDays - a.totalDays || a.leaveDays - b.leaveDays || a.start - b.start);
  const kept: Suggestion[] = [];
  for (const c of candidates) {
    const dominated = kept.some((k) => k.start <= c.end && c.start <= k.end && k.leaveDays <= c.leaveDays);
    if (!dominated) kept.push(c);
  }
  return kept;
}

export function rank(list: Suggestion[], by: 'value' | 'date'): Suggestion[] {
  const c = [...list];
  if (by === 'date') return c.sort((a, b) => a.start - b.start);
  return c.sort((a, b) => b.totalDays - a.totalDays || a.leaveDays - b.leaveDays || a.start - b.start);
}

/** วันลาทุกวันต้องอยู่ในช่วงที่อยากลา (ถ้าไม่ได้เลือกช่วง = ผ่านหมด) */
export function leaveWithin(s: Suggestion, ranges: DateRange[]): boolean {
  if (ranges.length === 0) return true;
  return s.days.every((d) => !d.isLeave || inRanges(d.iso, ranges));
}
