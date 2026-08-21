import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import api from '../utils/api';
import { SetAnnualFeeScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import DOBField from '../components/DOBField';

const formatDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ── Field wrapper (same contract as ActivityFormScreen) ───────────────────
function Field({ label, required, children, error, hint, charCount, maxChars }) {
  const over = maxChars != null && charCount > maxChars;
  return (
    <View style={styles.field.wrapper}>
      <View style={styles.field.labelRow}>
        <Text style={styles.field.label}>
          {label}{required && <Text style={styles.field.req}> *</Text>}
        </Text>
        {maxChars != null && (
          <Text style={[styles.field.counter, over && styles.field.counterOver]}>
            {charCount ?? 0}/{maxChars}
          </Text>
        )}
      </View>
      {children}
      {!!hint && !error && <Text style={styles.field.hint}>{hint}</Text>}
      {!!error && <Text style={styles.field.error}>{error}</Text>}
    </View>
  );
}

// ── Styled TextInput (same contract as ActivityFormScreen) ────────────────
function StyledInput({ hasError, multiline, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.styledInput.base,
        multiline && styles.styledInput.multiline,
        focused && styles.styledInput.focused,
        hasError && styles.styledInput.errored,
        style,
      ]}
      placeholderTextColor="#CBD5E1"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

const SetAnnualFeeScreen = () => {
  const [currentFee, setCurrentFee] = useState(null);
  const [amount, setAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});

  // Bounds for the date picker — same wide range style as
  // ActivityFormScreen's activityMinDate/activityMaxDate.
  const today = new Date();
  const feeMinDate =new Date(today.getFullYear() - 100, 0, 1);
  const feeMaxDate = new Date(today.getFullYear() + 80, 11, 31);

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
    const e = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      e.amount = 'Please enter a valid fee amount.';
    }
    if (!effectiveFrom) {
      e.effectiveFrom = 'Please select Effective From date.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    Alert.alert(
      'Confirm',
      `Set one-time membership fee to ₹${amount} effective from ${formatDate(effectiveFrom)}?`,
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Current Fee Card */}
        <View style={styles.currentCard}>
          <Text style={styles.currentTitle}>Current Annual Fee</Text>
          {fetching ? (
            <ActivityIndicator color={COLORS.accent} />
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

          <Field label="Fee Amount (₹)" required error={errors.amount}>
            <StyledInput
              placeholder="e.g. 1500"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(t) => {
                setAmount(t);
                if (errors.amount) setErrors(p => ({ ...p, amount: null }));
              }}
              hasError={!!errors.amount}
              returnKeyType="done"
            />
          </Field>

          {/* ── Effective From — same dd/mm/yyyy typing + wheel-list picker
               used across the app (ActivityFormScreen's Activity Date) ── */}
          <DOBField
            label="Effective From"
            required
            value={effectiveFrom}
            minDate={feeMinDate}
            maxDate={feeMaxDate}
            error={errors.effectiveFrom}
            FieldComponent={Field}
            InputComponent={StyledInput}
            onChange={(d) => {
              setEffectiveFrom(d);
              if (errors.effectiveFrom) setErrors(p => ({ ...p, effectiveFrom: null }));
            }}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.accent} />
              : <Text style={styles.buttonText}>Set Annual Fee</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SetAnnualFeeScreen;