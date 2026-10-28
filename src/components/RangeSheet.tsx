import { ReactNode, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { todayISO } from '../lib/dates';
import { DateRange, formatRange, normalizeRange } from '../lib/ranges';
import { colors } from '../theme';
import { MonthCalendar, MonthRef, monthOf } from './MonthCalendar';

type Props = {
  visible: boolean;
  title: string;
  hint: string;
  submitLabel: string;
  holidays: Record<string, string>;
  min: MonthRef;
  max: MonthRef;
  withName?: boolean;
  closeOnSubmit?: boolean;
  onSubmit: (range: DateRange, name: string) => void;
  onClose: () => void;
  children?: ReactNode;
};

/** หน้าต่างเลือกช่วงวันที่บนปฏิทิน: แตะวันเริ่ม แล้วแตะวันสิ้นสุด */
export function RangeSheet(p: Props) {
  const today = todayISO();
  const [month, setMonth] = useState<MonthRef>(() => monthOf(today));
  const [sel, setSel] = useState<{ start?: string; end?: string }>({});
  const [name, setName] = useState('');

  const pressDay = (iso: string) =>
    setSel((s) => (!s.start || s.end ? { start: iso } : normalizeRange(s.start, iso)));

  const range = sel.start ? normalizeRange(sel.start, sel.end ?? sel.start) : null;

  const submit = () => {
    if (!range) return;
    p.onSubmit(range, name);
    setSel({});
    setName('');
    if (p.closeOnSubmit) p.onClose();
  };

  return (
    <Modal visible={p.visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={p.onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <Text style={styles.title}>{p.title}</Text>
            <Pressable onPress={p.onClose} hitSlop={12}>
              <Text style={styles.done}>เสร็จ</Text>
            </Pressable>
          </View>
          <Text style={styles.sub}>{p.hint}</Text>

          <MonthCalendar
            value={month}
            onChange={setMonth}
            min={p.min}
            max={p.max}
            holidays={p.holidays}
            highlight={{ ...sel, solidEdges: true }}
            disabledBefore={today}
            onPressDay={pressDay}
          />

          <Text style={styles.selected}>
            {range ? formatRange(range) : 'แตะวันเริ่ม แล้วแตะวันสิ้นสุด (แตะวันเดียวสองครั้งก็ได้)'}
          </Text>

          {p.withName && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="ชื่อวันหยุด (ไม่ใส่ก็ได้)"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          )}
          <Pressable style={[styles.btn, !range && styles.btnOff]} disabled={!range} onPress={submit}>
            <Text style={styles.btnTxt}>{p.submitLabel}</Text>
          </Pressable>

          {p.children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export const sheetStyles = StyleSheet.create({
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  del: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  done: { fontSize: 17, fontWeight: '600', color: colors.leave },
  sub: { fontSize: 14, color: colors.muted },
  selected: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  btn: { backgroundColor: colors.leave, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnOff: { opacity: 0.4 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
