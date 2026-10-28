import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isWeekend, monthTitle, parseISO, THAI_WEEKDAYS, todayISO, toISO } from '../lib/dates';
import { DateRange, inRanges } from '../lib/ranges';
import { colors } from '../theme';

export type MonthRef = { year: number; month: number };

export function monthOf(iso: string): MonthRef {
  const [y, m] = iso.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const d = new Date(Date.UTC(year, month + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

const ord = (m: MonthRef) => m.year * 12 + m.month;

type Props = {
  value: MonthRef;
  onChange: (m: MonthRef) => void;
  min?: MonthRef;
  max?: MonthRef;
  holidays: Record<string, string>;
  /** วันที่ต้องลา (สีทึบ) */
  leave?: Set<string>;
  /** ช่วงที่ไฮไลต์พื้นอ่อน; solidEdges = วันเริ่ม/จบเป็นสีทึบ (ตอนกำลังเลือกช่วง) */
  highlight?: { start?: string; end?: string; solidEdges?: boolean };
  preferred?: DateRange[];
  /** วันก่อนหน้านี้จะจางและกดไม่ได้ */
  disabledBefore?: string;
  onPressDay?: (iso: string) => void;
};

export function MonthCalendar(p: Props) {
  const { year, month } = p.value;
  const offset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const today = todayISO();

  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(Date.UTC(year, month, d)));
  while (cells.length % 7) cells.push(null);

  const canPrev = !p.min || ord(p.value) > ord(p.min);
  const canNext = !p.max || ord(p.value) < ord(p.max);
  const hStart = p.highlight?.start;
  const hEnd = p.highlight?.end ?? hStart;

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable
          disabled={!canPrev}
          onPress={() => p.onChange(shiftMonth(p.value, -1))}
          hitSlop={12}
          accessibilityLabel="เดือนก่อน">
          <Text style={[styles.arrow, !canPrev && styles.faded]}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{monthTitle(year, month)}</Text>
        <Pressable
          disabled={!canNext}
          onPress={() => p.onChange(shiftMonth(p.value, 1))}
          hitSlop={12}
          accessibilityLabel="เดือนถัดไป">
          <Text style={[styles.arrow, !canNext && styles.faded]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {THAI_WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.cell, styles.weekday]}>
            {w}
          </Text>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <View key={`e${i}`} style={styles.cell} />;
          const disabled = !!p.disabledBefore && iso < p.disabledBefore;
          const holiday = p.holidays[iso];
          const inHighlight = !!hStart && !!hEnd && iso >= hStart && iso <= hEnd;
          const solid = p.leave?.has(iso) || (p.highlight?.solidEdges && (iso === hStart || iso === hEnd));
          const bg = solid ? colors.leave : inHighlight ? colors.leaveFill : holiday ? colors.holidayFill : undefined;
          const fg = solid ? '#fff' : holiday ? colors.holiday : isWeekend(parseISO(iso)) ? colors.muted : colors.text;
          return (
            <Pressable
              key={iso}
              style={styles.cell}
              disabled={disabled || !p.onPressDay}
              onPress={() => p.onPressDay?.(iso)}
              accessibilityLabel={iso + (holiday ? ` ${holiday}` : '')}>
              <View
                style={[
                  styles.day,
                  bg ? { backgroundColor: bg } : null,
                  iso === today && styles.today,
                  disabled && styles.faded,
                ]}>
                <Text style={[styles.dayTxt, { color: fg }]}>{Number(iso.slice(8))}</Text>
              </View>
              {p.preferred && inRanges(iso, p.preferred) && <View style={styles.prefBar} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 8 },
  arrow: { fontSize: 30, color: colors.leave, fontWeight: '600', paddingHorizontal: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: 12, color: colors.muted, textAlign: 'center', textAlignVertical: 'center', aspectRatio: 1.6 },
  day: { width: '84%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: colors.text },
  dayTxt: { fontSize: 15, fontWeight: '600' },
  prefBar: { position: 'absolute', bottom: 1, width: '50%', height: 3, borderRadius: 2, backgroundColor: colors.preferred },
  faded: { opacity: 0.3 },
});
