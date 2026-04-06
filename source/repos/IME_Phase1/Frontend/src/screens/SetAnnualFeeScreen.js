import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../utils/api';

const formatDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const SetAnnualFeeScreen = () => {
  const [currentFee, setCurrentFee] = useState(null);
  const [amount, setAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(null);
  const [effectiveTo, setEffectiveTo] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchCurrentFee();
  }, []);

  const fetchCurrentFee = async () => {
    try {
      setFetching(true);
      const res = await api.get('/payment/current-fee');
      if (res.data.success) setCurrentFee(res.data.data);
    } catch (e) {
      console.warn('Failed to fetch fee:', e.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid fee amount.');
      return;
    }
    if (!effectiveFrom) {
      Alert.alert('Validation Error', 'Please select Effective From date.');
      return;
    }
    if (effectiveTo && effectiveTo <= effectiveFrom) {
      Alert.alert('Validation Error', 'Effective To date must be after Effective From date.');
      return;
    }

    Alert.alert(
      'Confirm',
      `Set annual membership fee to ₹${amount} effective from ${formatDate(effectiveFrom)}${effectiveTo ? ` to ${formatDate(effectiveTo)}` : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: submitFee },
      ]
    );
  };

  const submitFee = async () => {
    try {
      setLoading(true);
      const res = await api.post('/payment/set-fee', {
        amount: parseFloat(amount),
        effectiveFrom: formatDate(effectiveFrom),
        effectiveTo: effectiveTo ? formatDate(effectiveTo) : null,
      });
      if (res.data.success) {
        Alert.alert('Success', 'Annual fee updated successfully.');
        setAmount('');
        setEffectiveFrom(null);
        setEffectiveTo(null);
        fetchCurrentFee();
      } else {
        Alert.alert('Error', res.data.message || 'Failed to set fee.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Current Fee Card */}
      <View style={styles.currentCard}>
        <Text style={styles.currentTitle}>Current Annual Fee</Text>
        {fetching ? (
          <ActivityIndicator color="#fff" />
        ) : currentFee ? (
          <>
            <Text style={styles.currentAmount}>₹{parseFloat(currentFee.amount).toFixed(2)}</Text>
            <Text style={styles.currentDate}>
              Effective from: {new Date(currentFee.effectiveFrom).toDateString()}
            </Text>
          </>
        ) : (
          <Text style={styles.currentDate}>No active fee set</Text>
        )}
      </View>

      {/* Set New Fee Form */}
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Set New Annual Fee</Text>

        <Text style={styles.label}>Fee Amount (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1500"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Effective From</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromPicker(true)}>
          <Text style={effectiveFrom ? styles.dateText : styles.datePlaceholder}>
            {effectiveFrom ? formatDate(effectiveFrom) : 'Select date'}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Effective To (Optional)</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setShowToPicker(true)}>
          <Text style={effectiveTo ? styles.dateText : styles.datePlaceholder}>
            {effectiveTo ? formatDate(effectiveTo) : 'Select date'}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Set Annual Fee</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={effectiveFrom || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            setShowFromPicker(Platform.OS === 'ios');
            if (date) setEffectiveFrom(date);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={effectiveTo || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={effectiveFrom || new Date()}
          onChange={(event, date) => {
            setShowToPicker(Platform.OS === 'ios');
            if (date) setEffectiveTo(date);
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  currentCard:     { backgroundColor: '#1E3A5F', margin: 16, borderRadius: 12, padding: 24, alignItems: 'center' },
  currentTitle:    { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  currentAmount:   { color: '#D4A017', fontSize: 36, fontWeight: 'bold' },
  currentDate:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 },
  form:            { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, elevation: 2 },
  sectionTitle:    { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 20 },
  label:           { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '600' },
  input:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: '#fafafa' },
  dateInput:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fafafa' },
  dateText:        { fontSize: 15, color: '#333' },
  datePlaceholder: { fontSize: 15, color: '#aaa' },
  calendarIcon:    { fontSize: 18 },
  button:          { backgroundColor: '#1E3A5F', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default SetAnnualFeeScreen;
