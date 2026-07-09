import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../utils/api';
import { SetAnnualFeeScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

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
  const [showFromPicker, setShowFromPicker] = useState(false);
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
    Alert.alert(
      'Confirm',
      `Set annual membership fee to ₹${amount} effective from ${formatDate(effectiveFrom)}?`,
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
      });
      if (res.data.success) {
        Alert.alert('Success', 'Annual fee updated successfully.');
        setAmount('');
        setEffectiveFrom(null);
        fetchCurrentFee();
      } else {
        Alert.alert('Error', getSafeErrorMessage(res.data));
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
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
    </ScrollView>
  );
};



export default SetAnnualFeeScreen;
