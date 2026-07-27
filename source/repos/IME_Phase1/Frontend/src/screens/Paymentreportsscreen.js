/**
 * PaymentReportsScreen.js
 * Admin -> Payment Reports for the logged-in admin's club.
 * Pick a start month/year and end month/year, fetch the report, then
 * download the server-generated .xlsx (S.No, Name, Joining Date, Payment
 * Amount, Payment ID, Payment Date, with an overall total row at the bottom)
 * and save it into the device's file manager.
 *
 * ⚠️ Expo project — uses Expo's own SDK modules (no native linking needed,
 * works in Expo Go, dev client, and production builds):
 *    npx expo install expo-file-system expo-sharing
 *
 * Save-to-file-manager pattern:
 *   1. Download to a private sandbox temp file first (no permission needed).
 *   2. Android → StorageAccessFramework folder picker (user picks "Download",
 *      file lands exactly where a normal download would, visible in the
 *      device's File Manager app).
 *      iOS → share sheet ("Save to Files" → Downloads / On My iPhone / iCloud),
 *      since iOS has no programmatically-writable Downloads folder.
 *
 * Month/Year picker — the <MonthYearPicker /> component below is a small,
 * dependency-free dropdown built from plain RN View/Text/TouchableOpacity
 * (field + "‹ year ›" nav + 4-column month grid). No native modules, no
 * extra installs, works in plain Expo Go. It's defined in this same file so
 * there's nothing else to drop into your project.
 *
 * ── IMPORTANT: month indexing ─────────────────────────────────────────
 * All local state (startMonth/endMonth) stays 0-11, the normal JS Date
 * convention, so the MonthYearPicker keeps working unchanged. The backend
 * (GetPaymentReport / DownloadPaymentReportExcel) expects 1-12. The two
 * network call sites below convert with toApiMonth() right before sending
 * — nowhere else in the file should add/subtract 1.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StatusBar, Alert, FlatList, StyleSheet, Platform,
} from 'react-native';
// "/legacy" gives the stable downloadAsync(url, fileUri, { headers }) API,
// which is what we need for an authenticated file download. This subpath
// exists on Expo SDK 54+. If your project is on an older SDK, change this
// import to:  import * as FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services/paymentService';
import api from '../utils/api'; // used to read the base URL for the raw file download
// ✅ fixed — was './screenStyles', which never exported PaymentReportsScreenStyles.
// This standalone file uses plain StyleSheet.create so it doesn't depend on
// your custom createScreenStyles wrapper.
import { PaymentReportsScreenStyles as styles } from './screenStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Local state keeps months 0-11 (JS Date convention, matches MONTHS[] and
// MonthYearPicker). The backend controller validates 1-12 and rejects
// anything outside that range with a 400, so every network call must
// convert through this helper right before building params.
const toApiMonth = (m) => m + 1;

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ────────────────────────────────────────────────────────────────────── *
 * MonthYearPicker — local component, lives in this file so everything is
 * self-contained.
 *
 * Props:
 *   label        - text shown above the field (optional)
 *   month, year  - controlled selected values (month is 0-11)
 *   onChange({ month, year }) - fired when a month cell is tapped
 *   maxYear      - highest year the user can navigate to (default: current year)
 *   minYear      - lowest year the user can navigate to (default: maxYear - 5)
 *   placeholder  - text shown in the field before anything is selected
 * ────────────────────────────────────────────────────────────────────── */
const MonthYearPicker = ({
  label,
  month,
  year,
  onChange,
  maxYear = new Date().getFullYear(),
  minYear,
  placeholder = 'Select a month',
}) => {
  const lowestYear = minYear ?? maxYear - 5;

  const [open, setOpen] = useState(false);
  // Year currently shown in the dropdown header — starts at the selected
  // year (or maxYear if nothing picked yet) and moves independently via ‹ ›
  // until the user taps a month.
  const [viewYear, setViewYear] = useState(year ?? maxYear);

  const hasValue = month != null && year != null;

  const openPicker = () => {
    setViewYear(year ?? maxYear);
    setOpen(true);
  };

  const goPrevYear = () => {
    if (viewYear - 1 >= lowestYear) setViewYear(viewYear - 1);
  };

  const goNextYear = () => {
    if (viewYear + 1 <= maxYear) setViewYear(viewYear + 1);
  };

  const pickMonth = (m) => {
    // Don't allow picking a month/year combo in the future.
    if (viewYear === maxYear && m > new Date().getMonth() && maxYear === new Date().getFullYear()) {
      return;
    }
    setOpen(false);
    onChange({ month: m, year: viewYear });
  };

  return (
    <View style={monthPickerStyles.wrap}>
      {!!label && <Text style={monthPickerStyles.label}>{label}</Text>}

      <TouchableOpacity style={monthPickerStyles.field} onPress={openPicker} activeOpacity={0.8}>
        <Text style={[monthPickerStyles.fieldText, !hasValue && monthPickerStyles.fieldPlaceholder]}>
          {hasValue ? `${MONTHS[month]} ${year}` : placeholder}
        </Text>
        <Text style={monthPickerStyles.fieldIcon}>📅</Text>
      </TouchableOpacity>

      {open && (
        <View style={monthPickerStyles.panel}>
          <View style={monthPickerStyles.yearRow}>
            <TouchableOpacity
              onPress={goPrevYear}
              disabled={viewYear <= lowestYear}
              style={monthPickerStyles.yearArrowBtn}
            >
              <Text style={[monthPickerStyles.yearArrow, viewYear <= lowestYear && monthPickerStyles.yearArrowDisabled]}>‹</Text>
            </TouchableOpacity>

            <Text style={monthPickerStyles.yearText}>{viewYear}</Text>

            <TouchableOpacity
              onPress={goNextYear}
              disabled={viewYear >= maxYear}
              style={monthPickerStyles.yearArrowBtn}
            >
              <Text style={[monthPickerStyles.yearArrow, viewYear >= maxYear && monthPickerStyles.yearArrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={monthPickerStyles.grid}>
            {MONTHS.map((m, idx) => {
              const isFuture =
                viewYear === maxYear &&
                maxYear === new Date().getFullYear() &&
                idx > new Date().getMonth();
              const isSelected = hasValue && idx === month && viewYear === year;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    monthPickerStyles.monthCell,
                    isSelected && monthPickerStyles.monthCellSelected,
                    isFuture && monthPickerStyles.monthCellDisabled,
                  ]}
                  onPress={() => pickMonth(idx)}
                  disabled={isFuture}
                >
                  <Text
                    style={[
                      monthPickerStyles.monthCellText,
                      isSelected && monthPickerStyles.monthCellTextSelected,
                      isFuture && monthPickerStyles.monthCellTextDisabled,
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const MONTH_PICKER_ACCENT = '#3B6EF0';

const monthPickerStyles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B6EF0',
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE3F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  fieldText: {
    fontSize: 15,
    color: '#1E2A3A',
    fontWeight: '500',
  },
  fieldPlaceholder: {
    color: '#8A93A6',
    fontWeight: '400',
  },
  fieldIcon: {
    fontSize: 16,
  },
  panel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E7ECF5',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  yearArrowBtn: {
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  yearArrow: {
    fontSize: 18,
    color: MONTH_PICKER_ACCENT,
    fontWeight: '700',
  },
  yearArrowDisabled: {
    color: '#C7CEDB',
  },
  yearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E2A3A',
    minWidth: 60,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthCell: {
    width: '23%',
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellSelected: {
    backgroundColor: MONTH_PICKER_ACCENT,
  },
  monthCellDisabled: {
    opacity: 0.4,
  },
  monthCellText: {
    fontSize: 14,
    color: '#1E2A3A',
    fontWeight: '500',
  },
  monthCellTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  monthCellTextDisabled: {
    color: '#B4BBC8',
  },
});
/* ─────────────────────────────── end MonthYearPicker ───────────────────────────────── */

const PaymentReportsScreen = ({ navigation }) => {
  const { user } = useAuth();
  // ⚠️ Adjust this to wherever the admin's club id actually lives on the user object.
  const clubId = user?.clubId;

  const now = new Date();

  // month is 0-11, year is a 4-digit number — plain values, no Date object
  // needed until we actually build the API date range.
  const [startMonth, setStartMonth] = useState(now.getMonth());
  const [startYear,  setStartYear]  = useState(now.getFullYear());
  const [endMonth,   setEndMonth]   = useState(now.getMonth());
  const [endYear,    setEndYear]    = useState(now.getFullYear());

  const [loading,  setLoading]  = useState(false);
  const [exporting,setExporting]= useState(false);
  const [rows,     setRows]     = useState([]);
  const [fetched,  setFetched]  = useState(false);

  const totalAmount = useMemo(
    () => rows.reduce((sum, r) => sum + Number(r.paymentAmount || 0), 0),
    [rows]
  );

  const handleGetPayments = async () => {
    if (!clubId) {
      Alert.alert('Missing Club', 'Could not determine your club. Please re-login and try again.');
      return;
    }

    // Local sanity check with real Date objects (0-11 months are fine here,
    // this never leaves the device).
    const rangeStart = new Date(startYear, startMonth, 1);
    const rangeEnd   = new Date(endYear, endMonth + 1, 0); // last day of end month
    if (rangeEnd < rangeStart) {
      Alert.alert('Invalid Range', 'End month must be on or after the start month.');
      return;
    }

    setLoading(true);
    setFetched(false);
    try {
      // paymentService.getPaymentReport(clubId, startMonth, startYear, endMonth, endYear)
      // — flat 1-12 month ints, matching the controller's [FromQuery] signature.
      const res = await paymentService.getPaymentReport(
        clubId,
        toApiMonth(startMonth),
        startYear,
        toApiMonth(endMonth),
        endYear
      );
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
        setFetched(true);
        if (res.data.length === 0) {
          Alert.alert('No Payments', 'No payments were found for the selected range.');
        }
      } else {
        Alert.alert('Error', res.message || 'Could not fetch the payment report.');
      }
    } catch (err) {
      console.error('Get payment report error:', err);
      Alert.alert('Error', 'Something went wrong while fetching the report.');
    } finally {
      setLoading(false);
    }
  };

  // ── Download the .xlsx and save it into the device's file manager ──
  //   1. Download to a private sandbox temp file (no permission needed).
  //   2. Android: SAF folder picker → write into the folder the user
  //      chose (pick "Download" → shows up in the real File Manager app).
  //      iOS: share sheet → user taps "Save to Files".
  const handleDownloadExcel = async () => {
    if (!rows.length) {
      Alert.alert('No Data', 'Fetch the payment report first.');
      return;
    }

    setExporting(true);
    try {
      const fileName = `IME_PaymentReport_${MONTHS[startMonth]}${startYear}_${MONTHS[endMonth]}${endYear}.xlsx`;
      const baseUrl = api.defaults.baseURL;

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Not Signed In', 'Please log in again and retry.');
        return;
      }

      // Same 0-11 → 1-12 conversion as handleGetPayments — the excel
      // controller validates the exact same range and 400s otherwise.
      const downloadUrl =
        `${baseUrl}/payment/report/excel` +
        `?clubId=${encodeURIComponent(clubId)}` +
        `&startMonth=${encodeURIComponent(toApiMonth(startMonth))}` +
        `&startYear=${encodeURIComponent(startYear)}` +
        `&endMonth=${encodeURIComponent(toApiMonth(endMonth))}` +
        `&endYear=${encodeURIComponent(endYear)}`;

      const tempUri = FileSystem.cacheDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, tempUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (downloadResult.status !== 200) {
        let serverMessage = `HTTP ${downloadResult.status}`;
        try {
          const body = await FileSystem.readAsStringAsync(tempUri);
          if (body) serverMessage = body.slice(0, 300);
        } catch (readErr) { }
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
        throw new Error(serverMessage);
      }

      if (Platform.OS === 'android') {
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permission needed',
            'Storage permission is required to save the report. Please try again and allow access.'
          );
          return;
        }

        const fileContent = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          fileName.replace(/\.[^/.]+$/, ''),
          XLSX_MIME
        );
        await FileSystem.writeAsStringAsync(destUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert('Saved', `"${fileName}" was saved to the folder you selected.`);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert('Saved', `"${fileName}" was downloaded, but sharing isn't available on this device.`);
          return;
        }
        await Sharing.shareAsync(tempUri, {
          mimeType: XLSX_MIME,
          dialogTitle: `Save "${fileName}"`,
        });
      }
    } catch (err) {
      console.error('Excel export error:', err);
      Alert.alert('Export Failed', err.message || 'Could not download the Excel report.');
    } finally {
      setExporting(false);
    }
  };

  const renderRow = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.cellSNo]}>{item.sNo}</Text>
      <Text style={[styles.cell, styles.cellName]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.cell, styles.cellDate]}>{formatDate(item.joiningDate)}</Text>
      <Text style={[styles.cell, styles.cellAmount]}>₹{item.paymentAmount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MonthYearPicker
          label="Start Month"
          month={startMonth}
          year={startYear}
          onChange={({ month, year }) => { setStartMonth(month); setStartYear(year); }}
        />

        <MonthYearPicker
          label="End Month"
          month={endMonth}
          year={endYear}
          onChange={({ month, year }) => { setEndMonth(month); setEndYear(year); }}
        />

        <TouchableOpacity
          style={[styles.getBtn, loading && styles.getBtnDisabled]}
          onPress={handleGetPayments}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.getBtnText}>Get Payment</Text>
          }
        </TouchableOpacity>

        {fetched && (
          <View style={styles.resultsWrap}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{rows.length} payment{rows.length !== 1 ? 's' : ''} found</Text>
              <Text style={styles.summaryTotal}>Total: ₹{totalAmount}</Text>
            </View>

            {rows.length > 0 && (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.cellHeader, styles.cellSNo]}>S.No</Text>
                  <Text style={[styles.cellHeader, styles.cellName]}>Name</Text>
                  <Text style={[styles.cellHeader, styles.cellDate]}>Joined</Text>
                  <Text style={[styles.cellHeader, styles.cellAmount]}>Amount</Text>
                </View>
                <FlatList
                  data={rows}
                  keyExtractor={(item) => String(item.paymentId)}
                  renderItem={renderRow}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
                />

                <TouchableOpacity
                  style={[styles.downloadBtn, exporting && styles.getBtnDisabled]}
                  onPress={handleDownloadExcel}
                  disabled={exporting}
                  activeOpacity={0.85}
                >
                  {exporting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.downloadBtnText}> Download as Excel</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default PaymentReportsScreen;