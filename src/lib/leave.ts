import { addDays, isWeekend, parseISO, toISO } from './dates';

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
 * หาช่วงหยุดต่อเนื่องที่ใช้วันลา "พอดี" leaveBudget วัน
 * ช่วงต้องเริ่มและจบด้วยวันหยุดอยู่แล้ว (ไม่เสียวันลาที่ขอบ)
 * และครอบคลุมช่วงสูงสุด (วันก่อนหน้า/ถัดไปเป็นวันทำงาน)
 */
export function findSuggestions(
  fromISO: string,
  toISOStr: string,
  holidays: Record<string, string>,
  leaveBudget: number,
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

  const out: Suggestion[] = [];
  for (let s = 0; s < total; s++) {
    // เริ่มที่วันหยุดแรกของบล็อกวันหยุด
    if (!off(s)) continue;
    if (s > 0 && off(s - 1)) continue;
    let used = 0;
    for (let e = s; e < total; e++) {
      if (!off(e)) {
        used++;
        if (used > leaveBudget) break;
      }
      const endsOff = off(e);
      const nextWork = e + 1 < total && !off(e + 1);
      if (used === leaveBudget && endsOff && (nextWork || e === total - 1)) {
        const slice = days.slice(s, e + 1).map((d) => ({ ...d, isLeave: d.kind === 'work' }));
        out.push({
          start: slice[0].ms,
          end: slice[slice.length - 1].ms,
          totalDays: slice.length,
          leaveDays: used,
          efficiency: slice.length / used,
          days: slice,
        });
      }
    }
  }
  return out;
}

export function rank(list: Suggestion[], by: 'value' | 'date'): Suggestion[] {
  const c = [...list];
  if (by === 'date') return c.sort((a, b) => a.start - b.start);
  return c.sort((a, b) => b.totalDays - a.totalDays || a.start - b.start);
}
