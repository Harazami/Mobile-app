import { Pressable, Text, View } from 'react-native';
import { DateRange, formatRange, groupHolidays } from '../lib/ranges';
import { MonthRef } from './MonthCalendar';
import { RangeSheet, sheetStyles as s } from './RangeSheet';

type Props = {
  visible: boolean;
  holidays: Record<string, string>;
  custom: Record<string, string>;
  min: MonthRef;
  max: MonthRef;
  onAdd: (range: DateRange, name: string) => void;
  onRemove: (days: string[]) => void;
  onClose: () => void;
};

export function HolidayManager({ visible, holidays, custom, min, max, onAdd, onRemove, onClose }: Props) {
  const groups = groupHolidays(custom);

  return (
    <RangeSheet
      visible={visible}
      title="วันหยุดของฉัน"
      hint="เพิ่มวันหยุดบริษัท วันหยุดพิเศษ หรือวันที่ไม่ต้องลา จะเป็นวันเดียวหรือเป็นช่วงก็ได้"
      submitLabel="เพิ่มวันหยุด"
      holidays={holidays}
      min={min}
      max={max}
      withName
      onSubmit={onAdd}
      onClose={onClose}>
      <Text style={s.section}>รายการที่เพิ่มไว้</Text>
      {groups.length === 0 && <Text style={s.muted}>ยังไม่มี</Text>}
      {groups.map((g) => (
        <View key={g.start} style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>
              {formatRange(g)}
              {g.days.length > 1 ? `  (${g.days.length} วัน)` : ''}
            </Text>
            <Text style={s.muted}>{g.name}</Text>
          </View>
          <Pressable onPress={() => onRemove(g.days)} hitSlop={12} accessibilityLabel={`ลบ ${g.name}`}>
            <Text style={s.del}>ลบ</Text>
          </Pressable>
        </View>
      ))}
    </RangeSheet>
  );
}
