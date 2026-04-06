import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import api from '../utils/api';

const PAYMENT_MODES = ['UPI', 'Bank Transfer', 'Cash', 'Cheque'];

const RegistrationPaymentScreen = ({ route, navigation }) => {
  const { userId, memberId, feeAmount, memberName } = route.params || {};
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    if (!transactionRef.trim()) {
      Alert.alert('Required', 'Please enter the transaction reference / UTR number.');
      return;
    }

    Alert.alert(
      'Confirm Payment',
      `Confirm payment of ₹${feeAmount} via ${paymentMode}?\nRef: ${transactionRef}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitPayment },
      ]
    );
  };

  const submitPayment = async () => {
    try {
      setLoading(true);
      const res = await api.post('/payment/register-payment', {
        memberId,
        userId,
        amount: feeAmount,
        paymentMode,
        transactionReference: transactionRef.trim(),
      });

      if (res.data.success) {
        Alert.alert(
          'Registration Complete!',
          'Your membership is now active. A confirmation email has been sent to your registered email. Please login to continue.',
          [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', res.data.message || 'Payment failed. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <Text style={styles.headerSubtitle}>Hi {memberName}, one last step!</Text>
      </View>

      {/* Fee Card */}
      <View style={styles.feeCard}>
        <Text style={styles.feeLabel}>Annual Membership Fee</Text>
        <Text style={styles.feeAmount}>₹{feeAmount?.toFixed(2)}</Text>
        <Text style={styles.feeNote}>Pay this amount and enter the transaction reference below.</Text>
      </View>

      {/* Payment Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Mode</Text>
        <View style={styles.modeRow}>
          {PAYMENT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeBtn, paymentMode === mode && styles.modeBtnActive]}
              onPress={() => setPaymentMode(mode)}
            >
              <Text style={[styles.modeBtnText, paymentMode === mode && styles.modeBtnTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transaction Reference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Reference / UTR No.</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter transaction reference"
          value={transactionRef}
          onChangeText={setTransactionRef}
          autoCapitalize="characters"
        />
        <Text style={styles.hint}>
          After completing the payment, enter the UTR / reference number from your payment app.
        </Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleConfirmPayment}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Confirm Payment & Activate Account</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>← Go back and edit registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { backgroundColor: '#1E3A5F', padding: 28, alignItems: 'center' },
  headerTitle:      { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle:   { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  feeCard:          { backgroundColor: '#D4A017', margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
  feeLabel:         { color: '#1E3A5F', fontSize: 13, fontWeight: '600' },
  feeAmount:        { color: '#1E3A5F', fontSize: 40, fontWeight: 'bold', marginVertical: 4 },
  feeNote:          { color: '#1E3A5F', fontSize: 12, textAlign: 'center', marginTop: 4 },
  section:          { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle:     { fontSize: 15, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },
  modeRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeBtn:          { borderWidth: 1.5, borderColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  modeBtnActive:    { backgroundColor: '#1E3A5F' },
  modeBtnText:      { color: '#1E3A5F', fontSize: 13, fontWeight: '600' },
  modeBtnTextActive:{ color: '#fff' },
  input:            { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#fafafa' },
  hint:             { fontSize: 12, color: '#888', marginTop: 8 },
  button:           { backgroundColor: '#1E3A5F', margin: 16, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled:   { opacity: 0.6 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink:         { alignItems: 'center', marginBottom: 30 },
  backLinkText:     { color: '#1976D2', fontSize: 14 },
});

export default RegistrationPaymentScreen;
