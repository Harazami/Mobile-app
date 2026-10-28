import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatWithYear, localDateToISO, parseISO } from '../lib/dates';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  custom: Record<string, string>;
  onAdd: (iso: string, name: string) => void;
  onRemove: (iso: string) => void;
  onClose: () => void;
};

export function HolidayManager({ visible, custom, onAdd, onRemove, onClose }: Props) {
  const [date, setDate] = useState(() => new Date());
  const [name, setName] = useState('');

  const entries = Object.entries(custom).sort(([a], [b]) => a.localeCompare(b));

  const submit = () => {
    onAdd(localDateToISO(date), name);
    setName('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <Text style={styles.title}>วันหยุดของฉัน</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.done}>เสร็จ</Text>
            </Pressable>
          </View>
          <Text style={styles.sub}>เพิ่มวันหยุดบริษัท วันหยุดพิเศษ หรือวันที่ไม่อยากลา ระบบจะนับเป็นวันหยุดตอนคำนวณ</Text>

          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              locale="th-TH"
              accentColor={colors.leave}
              onChange={(_, d) => d && setDate(d)}
            />
          </View>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ชื่อวันหยุด (ไม่ใส่ก็ได้)"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Pressable style={styles.addBtn} onPress={submit}>
            <Text style={styles.addTxt}>เพิ่ม {formatWithYear(parseISO(localDateToISO(date)))}</Text>
          </Pressable>

          <Text style={styles.section}>รายการที่เพิ่มไว้</Text>
          {entries.length === 0 && <Text style={styles.sub}>ยังไม่มี</Text>}
          {entries.map(([iso, label]) => (
            <View key={iso} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{formatWithYear(parseISO(iso))}</Text>
                <Text style={styles.sub}>{label}</Text>
              </View>
              <Pressable onPress={() => onRemove(iso)} hitSlop={12} accessibilityLabel={`ลบ ${label}`}>
                <Text style={styles.del}>ลบ</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 16, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  done: { fontSize: 17, fontWeight: '600', color: colors.leave },
  sub: { fontSize: 14, color: colors.muted },
  pickerWrap: { backgroundColor: colors.card, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: colors.border },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  addBtn: { backgroundColor: colors.leave, borderRadius: 12, padding: 14, alignItems: 'center' },
  addTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
  del: { color: '#D64545', fontSize: 15, fontWeight: '600' },
});
