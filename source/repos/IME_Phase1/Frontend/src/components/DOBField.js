import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Platform, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../screens/theme'; // adjust path to your theme file

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad2 = (n) => String(n).padStart(2, '0');
const daysInMonth = (monthIndex, year) => new Date(year, monthIndex + 1, 0).getDate();

const formatDMY = (date) => {
  if (!date) return '';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
};

const formatManualDMY = (text) => {
  let cleaned = text.replace(/[^0-9/]/g, '').replace(/\/{2,}/g, '/');
  let segs = cleaned.split('/');
  if (segs.length > 3) segs = segs.slice(0, 3);
  segs[0] = (segs[0] || '').slice(0, 2);
  if (segs.length > 1) segs[1] = segs[1].slice(0, 2);
  if (segs.length > 2) segs[2] = segs[2].slice(0, 4);
  return segs.join('/');
};

const parseDMY = (text, minDate, maxDate) => {
  const segs = text.split('/');
  if (segs.length !== 3) return null;
  const [dRaw, mRaw, yRaw] = segs;
  if (!dRaw || !mRaw || yRaw.length !== 4) return null;

  const day = parseInt(dRaw, 10);
  const month = parseInt(mRaw, 10);
  const year = parseInt(yRaw, 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  if (month < 1 || month > 12) return null;
  const dim = daysInMonth(month - 1, year);
  if (day < 1 || day > dim) return null;

  const date = new Date(year, month - 1, day);
  if (minDate && date < minDate) return null;
  if (maxDate && date > maxDate) return null;
  return { date, display: `${pad2(day)}/${pad2(month)}/${year}` };
};

const s = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  textInputFlex: { flex: 1 },
  calendarIconBtn: {
    marginLeft: 8, width: 44, height: 44, borderRadius: 10,
    borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    // Height is capped shorter than before (was 72%) so the sheet's top
    // edge can't reach up into the status bar / notch area on shorter
    // phone screens. Bottom padding is now added dynamically via
    // insets.bottom at render time (see JSX below) instead of a fixed
    // paddingBottom: 24, so it clears the home indicator / gesture bar /
    // Android nav bar on every device instead of getting hidden behind it.
    maxHeight: '65%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  modalActionText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  columnsRow: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10, gap: 10 },
  columnBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F8FAFC' },
  columnLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  columnValue: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  listWrap: { maxHeight: 320 },
  listItem: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listItemSelected: { backgroundColor: '#EEF2FF' },
  listItemText: { fontSize: 15, color: COLORS.dark, textAlign: 'center' },
  listItemTextSelected: { fontWeight: '700', color: COLORS.accent },
  backRow: { paddingHorizontal: 18, paddingVertical: 12 },
  backText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
});

// DOBField needs Field + StyledInput passed in (or import your shared ones)
export default function DOBField({ label, required, value, onChange, error, minDate, maxDate, FieldComponent, InputComponent }) {
  const Field = FieldComponent;
  const StyledInput = InputComponent;
  const insets = useSafeAreaInsets();

  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const bounds = {
    min: minDate || new Date(1900, 0, 1),
    max: maxDate || new Date(),
  };

  // Safety net: clamp any year into the valid [min, max] range.
  // This can't fix a bad `value` upstream, but it guarantees the
  // picker can never display/produce a garbled year like "20236".
  const clampYear = (y) => Math.min(Math.max(y, bounds.min.getFullYear()), bounds.max.getFullYear());

  // When no value has been picked yet, the picker should open showing
  // *today's* date — not bounds.max, which may be a future year.
  const todayClamped = () => {
    const t = new Date();
    if (t < bounds.min) return bounds.min;
    if (t > bounds.max) return bounds.max;
    return t;
  };

  const base = value || todayClamped();
  const [tempDay, setTempDay] = useState(base.getDate());
  const [tempMonth, setTempMonth] = useState(base.getMonth());
  const [tempYear, setTempYear] = useState(clampYear(base.getFullYear()));
  const [manualText, setManualText] = useState(value ? formatDMY(value) : '');
  const [manualError, setManualError] = useState(null);

  useEffect(() => {
    setManualText(value ? formatDMY(value) : '');
  }, [value]);

  const years = React.useMemo(() => {
    const list = [];
    for (let y = bounds.max.getFullYear(); y >= bounds.min.getFullYear(); y--) list.push(y);
    return list;
  }, [bounds.min.getFullYear(), bounds.max.getFullYear()]);

  const openPicker = () => {
    const b = value || todayClamped();
    setTempDay(b.getDate());
    setTempMonth(b.getMonth());
    setTempYear(clampYear(b.getFullYear()));
    setExpanded(null);
    setVisible(true);
  };

  const pickDay = (d) => { setTempDay(d); setExpanded(null); };
  const pickMonth = (m) => {
    setTempMonth(m);
    const dim = daysInMonth(m, tempYear);
    if (tempDay > dim) setTempDay(dim);
    setExpanded(null);
  };
  const pickYear = (y) => {
    setTempYear(clampYear(y));
    const dim = daysInMonth(tempMonth, y);
    if (tempDay > dim) setTempDay(dim);
    setExpanded(null);
  };
  const confirmPicker = () => {
    onChange(new Date(tempYear, tempMonth, tempDay));
    setVisible(false);
  };

  const handleManualChange = (text) => {
    const formatted = formatManualDMY(text);
    setManualText(formatted);
    setManualError(null);

    const segs = formatted.split('/');
    const isComplete = segs.length === 3 && segs[2].length === 4;
    if (!isComplete) return;

    const result = parseDMY(formatted, bounds.min, bounds.max);
    if (!result) {
      setManualError('Enter a valid date of birth.');
      return;
    }
    setManualText(result.display);
    onChange(result.date);
  };

  const dayList = Array.from({ length: daysInMonth(tempMonth, tempYear) }, (_, i) => i + 1);

  return (
    <Field label={label} required={required} error={error || manualError}>
      <View style={s.inputRow}>
        <StyledInput
          style={s.textInputFlex}
          placeholder="dd/mm/yyyy  02/12/2000"
          value={manualText}
          onChangeText={handleManualChange}
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
          maxLength={10}
          hasError={!!manualError || !!error}
          returnKeyType="done"
        />
        <TouchableOpacity activeOpacity={0.8} onPress={openPicker} style={s.calendarIconBtn}>
          <Text style={{ fontSize: 18 }}>📅</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={s.modalOverlay}>
          {/*
            insets.bottom clears the home indicator (iOS) / gesture bar
            or 3-button nav (Android) so "Done" and the last list row
            are never hidden behind system UI. The sheet's maxHeight was
            also reduced above so the header can't get pushed up under
            the status bar / notch on shorter screens.
          */}
          <View style={[s.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={s.modalHeader}>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={s.modalActionText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={s.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={confirmPicker}>
                <Text style={s.modalActionText}>Done</Text>
              </TouchableOpacity>
            </View>

            {expanded === null && (
              <View style={s.columnsRow}>
                <TouchableOpacity style={s.columnBtn} onPress={() => setExpanded('day')}>
                  <Text style={s.columnLabel}>Day</Text>
                  <Text style={s.columnValue}>{pad2(tempDay)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.columnBtn} onPress={() => setExpanded('month')}>
                  <Text style={s.columnLabel}>Month</Text>
                  <Text style={s.columnValue}>{MONTHS[tempMonth].slice(0, 3)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.columnBtn} onPress={() => setExpanded('year')}>
                  <Text style={s.columnLabel}>Year</Text>
                  <Text style={s.columnValue}>{tempYear}</Text>
                </TouchableOpacity>
              </View>
            )}

            {expanded === 'day' && (
              <>
                <TouchableOpacity style={s.backRow} onPress={() => setExpanded(null)}>
                  <Text style={s.backText}>‹ Back</Text>
                </TouchableOpacity>
                <FlatList
                  style={s.listWrap}
                  data={dayList}
                  keyExtractor={(d) => String(d)}
                  initialScrollIndex={Math.max(0, tempDay - 1)}
                  getItemLayout={(_, i) => ({ length: 49, offset: 49 * i, index: i })}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[s.listItem, item === tempDay && s.listItemSelected]} onPress={() => pickDay(item)}>
                      <Text style={[s.listItemText, item === tempDay && s.listItemTextSelected]}>{pad2(item)}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {expanded === 'month' && (
              <>
                <TouchableOpacity style={s.backRow} onPress={() => setExpanded(null)}>
                  <Text style={s.backText}>‹ Back</Text>
                </TouchableOpacity>
                <FlatList
                  style={s.listWrap}
                  data={MONTHS}
                  keyExtractor={(m) => m}
                  initialScrollIndex={Math.max(0, tempMonth)}
                  getItemLayout={(_, i) => ({ length: 49, offset: 49 * i, index: i })}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity style={[s.listItem, index === tempMonth && s.listItemSelected]} onPress={() => pickMonth(index)}>
                      <Text style={[s.listItemText, index === tempMonth && s.listItemTextSelected]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {expanded === 'year' && (
              <>
                <TouchableOpacity style={s.backRow} onPress={() => setExpanded(null)}>
                  <Text style={s.backText}>‹ Back</Text>
                </TouchableOpacity>
                <FlatList
                  style={s.listWrap}
                  data={years}
                  keyExtractor={(y) => String(y)}
                  initialScrollIndex={Math.max(0, years.indexOf(tempYear))}
                  getItemLayout={(_, i) => ({ length: 49, offset: 49 * i, index: i })}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[s.listItem, item === tempYear && s.listItemSelected]} onPress={() => pickYear(item)}>
                      <Text style={[s.listItemText, item === tempYear && s.listItemTextSelected]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </Field>
  );
}