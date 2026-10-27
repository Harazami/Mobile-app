import { StyleSheet, Text, View } from 'react-native';
import { formatWithYear, THAI_WEEKDAYS } from '../lib/dates';
import type { DayKind, Suggestion } from '../lib/leave';
import { colors } from '../theme';

const KIND_COLOR: Record<DayKind, string> = {
  work: colors.border,
  weekend: colors.weekend,
  holiday: colors.holiday,
};

export function ResultCard({ item, best }: { item: Suggestion; best: boolean }) {
  const holidays = Array.from(new Set(item.days.filter((d) => d.holidayName).map((d) => d.holidayName)));

  return (
    <View style={[styles.card, best && styles.cardBest]}>
      <View style={styles.header}>
        <Text style={styles.range}>
          {formatWithYear(item.start)} – {formatWithYear(item.end)}
        </Text>
        {best && <Text style={styles.badge}>คุ้มสุด</Text>}
      </View>
      <Text style={styles.summary}>
        ลา {item.leaveDays} วัน → หยุดรวม <Text style={styles.big}>{item.totalDays}</Text> วัน
        {'  '}
        <Text style={styles.muted}>(คุ้ม {item.efficiency.toFixed(1)}x)</Text>
      </Text>
      <View style={styles.strip}>
        {item.days.map((d) => (
          <View key={d.iso} style={styles.cell}>
            <View style={[styles.dot, { backgroundColor: d.isLeave ? colors.leave : KIND_COLOR[d.kind] }]} />
            <Text style={styles.wd}>{THAI_WEEKDAYS[new Date(d.ms).getUTCDay()]}</Text>
            <Text style={styles.dn}>{Number(d.iso.slice(8))}</Text>
          </View>
        ))}
      </View>
      {holidays.length > 0 && <Text style={styles.muted}>มีวันหยุด: {holidays.join(', ')}</Text>}
    </View>
  );
}

export function Legend() {
  const items: [string, string][] = [
    [colors.leave, 'วันที่ต้องลา'],
    [colors.holiday, 'วันหยุดนักขัตฤกษ์'],
    [colors.weekend, 'เสาร์-อาทิตย์'],
  ];
  return (
    <View style={styles.legend}>
      {items.map(([c, t]) => (
        <View key={t} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: c }]} />
          <Text style={styles.muted}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardBest: { borderColor: colors.leave, borderWidth: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  range: { fontSize: 17, fontWeight: '700', color: colors.text },
  badge: {
    backgroundColor: colors.leave,
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  summary: { fontSize: 15, color: colors.text },
  big: { fontSize: 20, fontWeight: '800', color: colors.leave },
  muted: { fontSize: 13, color: colors.muted },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { alignItems: 'center', width: 30, gap: 2 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  wd: { fontSize: 11, color: colors.muted },
  dn: { fontSize: 13, fontWeight: '600', color: colors.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
