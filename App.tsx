import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Legend, ResultCard } from './src/components/ResultCard';
import { HOLIDAYS, LAST_DATE } from './src/data/holidays';
import { todayISO } from './src/lib/dates';
import { findSuggestions, rank } from './src/lib/leave';
import { colors } from './src/theme';

export default function App() {
  const [budget, setBudget] = useState(3);
  const [sortBy, setSortBy] = useState<'value' | 'date'>('value');

  const results = useMemo(
    () => rank(findSuggestions(todayISO(), LAST_DATE, HOLIDAYS, budget), sortBy),
    [budget, sortBy],
  );
  const maxTotal = useMemo(() => Math.max(0, ...results.map((r) => r.totalDays)), [results]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={results}
        keyExtractor={(r) => String(r.start)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>ลาวันไหนดี</Text>
            <Text style={styles.sub}>เลือกจำนวนวันลา แล้วดูช่วงที่ได้หยุดยาวคุ้มที่สุด</Text>

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
            <Legend />
          </View>
        }
        ListEmptyComponent={<Text style={styles.sub}>ไม่พบช่วงที่ลงตัวพอดี ลองเปลี่ยนจำนวนวันลาดูนะ</Text>}
        renderItem={({ item }) => <ResultCard item={item} best={sortBy === 'value' && item.totalDays === maxTotal} />}
      />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16 },
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
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.text, borderColor: colors.text },
  chipTxt: { color: colors.text, fontSize: 14 },
  chipTxtOn: { color: '#fff' },
});
