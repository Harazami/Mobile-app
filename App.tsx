import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HolidayManager } from './src/components/HolidayManager';
import { MonthCalendar, MonthRef, monthOf } from './src/components/MonthCalendar';
import { RangeSheet } from './src/components/RangeSheet';
import { Legend, ResultCard } from './src/components/ResultCard';
import { HOLIDAYS, LAST_DATE } from './src/data/holidays';
import { useCustomHolidays } from './src/hooks/useCustomHolidays';
import { usePersistentState } from './src/hooks/usePersistentState';
import { formatShort, isWeekend, parseISO, THAI_WEEKDAYS, todayISO, toISO } from './src/lib/dates';
import { findSuggestions, rank, Suggestion } from './src/lib/leave';
import { DateRange, formatRange } from './src/lib/ranges';
import { colors } from './src/theme';

const MAX_SHOWN = 30;

export default function App() {
  const today = todayISO();
  const minMonth = monthOf(today);
  const maxMonth = monthOf(LAST_DATE);

  const [budget, setBudget] = useState(3);
  const [sortBy, setSortBy] = useState<'value' | 'date'>('value');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [managing, setManaging] = useState(false);
  const [pickingPreferred, setPickingPreferred] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState<MonthRef>(minMonth);
  const [tappedDay, setTappedDay] = useState<string | null>(null);

  const { custom, addRange, removeDays } = useCustomHolidays();
  const [preferred, setPreferred] = usePersistentState<DateRange[]>('preferredRanges.v1', []);
  const holidays = useMemo(() => ({ ...HOLIDAYS, ...custom }), [custom]);

  const results = useMemo(
    () =>
      rank(findSuggestions(today, LAST_DATE, holidays, budget, preferred), sortBy),
    [today, budget, sortBy, holidays, preferred],
  );
  const maxTotal = useMemo(() => Math.max(0, ...results.map((r) => r.totalDays)), [results]);
  const byValue = useMemo(() => rank(results, 'value'), [results]);

  // ช่วงที่โชว์บนปฏิทิน: ที่ผู้ใช้เลือก หรือช่วงที่คุ้มที่สุด
  const selected = results.find((r) => r.id === selectedId) ?? byValue[0];
  const selectedLeave = useMemo(
    () => new Set(selected?.days.filter((d) => d.isLeave).map((d) => d.iso)),
    [selected],
  );

  // เมื่อแผนที่เลือกเปลี่ยน (เช่น เปลี่ยนจำนวนวันลา/ช่วงที่อยากลา) ให้ปฏิทินเลื่อนไปเดือนนั้น
  useEffect(() => {
    if (selected) setCalMonth(monthOf(toISO(selected.start)));
  }, [selected?.id]);

  const openOnCalendar = (s: Suggestion) => {
    setSelectedId(s.id);
    setTappedDay(null);
    setView('calendar');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.title}>ลาวันไหนดี</Text>
        <Text style={styles.sub}>เลือกจำนวนวันลาและช่วงที่อยากลา แล้วดูว่าลาวันไหนได้หยุดยาวคุ้มที่สุด</Text>

        <View style={styles.stepper}>
          <Pressable
            accessibilityLabel="ลดวันลา"
            style={[styles.stepBtn, budget <= 1 && styles.disabled]}
            onPress={() => setBudget((b) => Math.max(1, b - 1))}>
            <Text style={styles.stepTxt}>−</Text>
          </Pressable>
          <View style={styles.stepMid}>
            <Text style={styles.stepNum}>{budget}</Text>
            <Text style={styles.sub}>วันลา</Text>
          </View>
          <Pressable
            accessibilityLabel="เพิ่มวันลา"
            style={[styles.stepBtn, budget >= 10 && styles.disabled]}
            onPress={() => setBudget((b) => Math.min(10, b + 1))}>
            <Text style={styles.stepTxt}>+</Text>
          </Pressable>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>ช่วงที่อยากลา</Text>
          <Text style={styles.sub}>
            {preferred.length === 0
              ? 'ยังไม่ได้เลือก จะหาจากทุกช่วงถึงสิ้นปี 2570'
              : 'จะแนะนำเฉพาะแผนที่วันลาทุกวันอยู่ในช่วงเหล่านี้'}
          </Text>
          <View style={styles.chips}>
            {preferred.map((r) => (
              <Pressable
                key={r.start + r.end}
                style={[styles.chip, styles.chipPref]}
                onPress={() => setPreferred((list) => list.filter((x) => x !== r))}
                accessibilityLabel={`ลบช่วง ${formatRange(r)}`}>
                <Text style={styles.chipPrefTxt}>{formatRange(r)}  ✕</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setPickingPreferred(true)} style={[styles.chip, styles.chipAdd]}>
              <Text style={styles.chipAddTxt}>+ เพิ่มช่วง</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.chips}>
          <Pressable onPress={() => setManaging(true)} style={[styles.chip, styles.chipAdd]}>
            <Text style={styles.chipAddTxt}>
              + วันหยุดของฉัน{Object.keys(custom).length ? ` (${Object.keys(custom).length})` : ''}
            </Text>
          </Pressable>
        </View>

        <View style={styles.segment}>
          {(
            [
              ['list', 'รายการ'],
              ['calendar', 'ปฏิทิน'],
            ] as const
          ).map(([k, label]) => (
            <Pressable key={k} onPress={() => setView(k)} style={[styles.segBtn, view === k && styles.segOn]}>
              <Text style={[styles.segTxt, view === k && styles.segTxtOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Legend />

        {results.length === 0 && (
          <Text style={styles.sub}>
            ไม่พบแผนที่ใช้วันลาไม่เกิน {budget} วัน{preferred.length ? 'ในช่วงที่เลือก' : ''} ลองเปลี่ยนจำนวนวันลา
            {preferred.length ? 'หรือขยายช่วงที่อยากลา' : ''}ดูนะ
          </Text>
        )}

        {view === 'list' && results.length > 0 && (
          <>
            <View style={styles.chips}>
              {(
                [
                  ['value', 'หยุดยาวสุด'],
                  ['date', 'ตามวันที่'],
                ] as const
              ).map(([k, label]) => (
                <Pressable key={k} onPress={() => setSortBy(k)} style={[styles.chip, sortBy === k && styles.chipOn]}>
                  <Text style={[styles.chipTxt, sortBy === k && styles.chipTxtOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {results.slice(0, MAX_SHOWN).map((item) => (
              <ResultCard
                key={item.id}
                item={item}
                best={sortBy === 'value' && item.totalDays === maxTotal}
                onPress={() => openOnCalendar(item)}
              />
            ))}
            {results.length > MAX_SHOWN && (
              <Text style={styles.sub}>
                แสดง {MAX_SHOWN} จาก {results.length} ช่วง
              </Text>
            )}
          </>
        )}

        {view === 'calendar' && (
          <View style={{ gap: 12 }}>
            <MonthCalendar
              value={calMonth}
              onChange={setCalMonth}
              min={minMonth}
              max={maxMonth}
              holidays={holidays}
              leave={selectedLeave}
              highlight={selected ? { start: toISO(selected.start), end: toISO(selected.end) } : undefined}
              preferred={preferred}
              disabledBefore={today}
              onPressDay={setTappedDay}
            />
            {tappedDay && (
              <Text style={styles.dayInfo}>
                {THAI_WEEKDAYS[new Date(parseISO(tappedDay)).getUTCDay()]} {formatShort(parseISO(tappedDay))}
                {' · '}
                {holidays[tappedDay] ??
                  (selectedLeave.has(tappedDay)
                    ? 'วันที่แนะนำให้ลา'
                    : isWeekend(parseISO(tappedDay))
                      ? 'วันหยุดสุดสัปดาห์'
                      : 'วันทำงาน')}
              </Text>
            )}
            {selected && <ResultCard item={selected} best={selected.totalDays === maxTotal} />}
            {byValue.length > 1 && (
              <>
                <Text style={styles.boxTitle}>แผนอื่นที่คุ้ม</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {byValue.slice(0, MAX_SHOWN).map((s) => (
                    <Pressable
                      key={s.id}
                      onPress={() => openOnCalendar(s)}
                      style={[styles.chip, s === selected && styles.chipOn]}>
                      <Text style={[styles.chipTxt, s === selected && styles.chipTxtOn]}>
                        {formatShort(s.start)} · {s.totalDays} วัน
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <HolidayManager
        visible={managing}
        holidays={holidays}
        custom={custom}
        min={minMonth}
        max={maxMonth}
        onAdd={addRange}
        onRemove={removeDays}
        onClose={() => setManaging(false)}
      />
      <RangeSheet
        visible={pickingPreferred}
        title="ช่วงที่อยากลา"
        hint="เลือกช่วงที่สะดวกลา เช่น ปลายปี หรือช่วงสงกรานต์ เพิ่มได้หลายช่วง"
        submitLabel="ใช้ช่วงนี้"
        holidays={holidays}
        min={minMonth}
        max={maxMonth}
        closeOnSubmit
        onSubmit={(r) => setPreferred((list) => [...list, r].sort((a, b) => a.start.localeCompare(b.start)))}
        onClose={() => setPickingPreferred(false)}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 8 },
  sub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.leave, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.35 },
  stepTxt: { color: '#fff', fontSize: 28, fontWeight: '600' },
  stepMid: { alignItems: 'center' },
  stepNum: { fontSize: 40, fontWeight: '800', color: colors.text },
  box: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  boxTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 2 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipTxt: { color: colors.text, fontSize: 14 },
  chipTxtOn: { color: '#fff' },
  chipAdd: { borderColor: colors.leave },
  chipAddTxt: { color: colors.leave, fontSize: 14, fontWeight: '600' },
  chipPref: { borderColor: colors.preferred, backgroundColor: '#E6F6EC' },
  chipPrefTxt: { color: colors.preferred, fontSize: 14, fontWeight: '600' },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 3,
    marginTop: 16,
    marginBottom: 12,
  },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segOn: { backgroundColor: colors.card },
  segTxt: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  segTxtOn: { color: colors.text },
  dayInfo: { fontSize: 15, color: colors.text, textAlign: 'center' },
});
