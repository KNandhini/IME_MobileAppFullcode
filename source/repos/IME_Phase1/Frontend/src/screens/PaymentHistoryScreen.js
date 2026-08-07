import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// "/legacy" gives the stable downloadAsync(url, fileUri, { headers }) API,
// which is what we need for an authenticated file download. Same pattern
// used in PaymentReportsScreen. If your project is on an older Expo SDK
// without this subpath, switch to: import * as FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { paymentService } from '../services/paymentService';
import { PaymentHistoryScreenStyles as styles } from './screenStyles';

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const PaymentHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [membershipPayments, setMembershipPayments] = useState([]);
  const [fundraisePayments, setFundraisePayments] = useState([]);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      const raw = await AsyncStorage.getItem('userData');
      if (!raw) { setLoading(false); return; }
      const parsed = JSON.parse(raw);
      const id = parsed.memberId || parsed.userId;
      setMemberId(id);
      await loadHistory(id);
    } catch (e) {
      console.warn('Bootstrap error:', e);
      setLoading(false);
    }
  };

  const loadHistory = async (id) => {
    setLoading(true);
    const res = await paymentService.getMemberHistory(id);
    if (res?.success && res.data) {
      setMembershipPayments(res.data.membershipPayments || res.data.MembershipPayments || []);
      setFundraisePayments(res.data.fundraisePayments || res.data.FundraisePayments || []);
    } else {
      Alert.alert('Error', res?.message || 'Failed to load payment history.');
    }
    setLoading(false);
  };

  // ── Download the .xlsx and save it into the device's file manager ──
  // Same pattern as PaymentReportsScreen.handleDownloadExcel:
  //   1. Download to a private sandbox temp file (no permission needed).
  //   2. Android: SAF folder picker → write into the folder the user
  //      chose (pick "Download" → shows up in the real File Manager app).
  //      iOS: share sheet → user taps "Save to Files".
  const handleDownloadExcel = async () => {
    if (!memberId) return;

    setExporting(true);
    try {
      const fileName = `IME_MembershipPaymentReport_${memberId}.xlsx`;
      const downloadUrl = paymentService.getExcelDownloadUrl(memberId);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Not Signed In', 'Please log in again and retry.');
        return;
      }

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

  const membershipTotal = membershipPayments.reduce((s, p) => s + (p.amount ?? p.Amount ?? 0), 0);
  const fundraiseTotal = fundraisePayments.reduce((s, p) => s + (p.amount ?? p.Amount ?? 0), 0);

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  const hasAnyPayments = membershipPayments.length > 0 || fundraisePayments.length > 0;

  // ── No records at all: show a single empty state, no cards, no download button ──
  if (!hasAnyPayments) {
    return (
      <View style={styles.root}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#CBD5E1" />
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '700', color: COLORS.dark }}>
            No payment history
          </Text>
          <Text style={{ marginTop: 4, fontSize: 14, color: COLORS.placeholder }}>
            You haven't made any payments yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      

      <ScrollView contentContainerStyle={styles.body}>

        {/* ── Membership Payments Card ── */}
        {membershipPayments.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={NAVY} />
              <Text style={styles.cardTitle}>Membership Payments</Text>
            </View>

            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colSno]}>S.No</Text>
              <Text style={[styles.th, styles.colName]}>Club Name</Text>
              <Text style={[styles.th, styles.colDate]}>Date</Text>
              <Text style={[styles.th, styles.colAmount]}>Amount</Text>
            </View>
            {membershipPayments.map((p, i) => (
              <View key={p.paymentId ?? p.PaymentId ?? i} style={styles.tableRow}>
                <Text style={[styles.td, styles.colSno]}>{p.sNo ?? p.SNo ?? i + 1}</Text>
                <View style={styles.colName}>
                  <Text style={styles.td} numberOfLines={1}>{p.clubName ?? p.ClubName}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{p.paymentId ?? p.PaymentId}</Text>
                </View>
                <Text style={[styles.td, styles.colDate]}>{formatDate(p.paymentDate ?? p.PaymentDate)}</Text>
                <Text style={[styles.td, styles.colAmount]}>₹{(p.amount ?? p.Amount ?? 0).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{membershipTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {/* ── Fundraise Payments Card ── */}
        {fundraisePayments.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="hand-heart-outline" size={20} color={NAVY} />
              <Text style={styles.cardTitle}>Fund Payments</Text>
            </View>

            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, styles.colSno]}>S.No</Text>
              <Text style={[styles.th, styles.colName]}>Fund Name</Text>
              <Text style={[styles.th, styles.colDate]}>Date</Text>
              <Text style={[styles.th, styles.colAmount]}>Amount</Text>
            </View>
            {fundraisePayments.map((p, i) => (
              <View key={p.paymentId ?? p.PaymentId ?? i} style={styles.tableRow}>
                <Text style={[styles.td, styles.colSno]}>{p.sNo ?? p.SNo ?? i + 1}</Text>
                <View style={styles.colName}>
                  <Text style={styles.td} numberOfLines={1}>{p.fundName ?? p.FundName}</Text>
                  <Text style={styles.tdSub} numberOfLines={1}>{p.paymentId ?? p.PaymentId}</Text>
                </View>
                <Text style={[styles.td, styles.colDate]}>{formatDate(p.paymentDate ?? p.PaymentDate)}</Text>
                <Text style={[styles.td, styles.colAmount]}>₹{(p.amount ?? p.Amount ?? 0).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{fundraiseTotal.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.downloadBtn, exporting && { opacity: 0.7 }]}
          onPress={handleDownloadExcel}
          disabled={exporting}
          activeOpacity={0.85}
        >
          {exporting
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : (
              <>
                <MaterialCommunityIcons name="microsoft-excel" size={18} color={COLORS.white} />
                <Text style={styles.downloadBtnText}>Download Excel Report</Text>
              </>
            )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default PaymentHistoryScreen;