import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// RoleId convention shared with the backend / SignupScreen:
// 1 = Serving/Retired Engineers, 2 = Engineering Students, 3 = Organisations/Others
// RoleId values from database
// 2 = Serving / Retired Engineers
// 6 = Engineering Students
// 5 = Organisations / Others
const MEMBERSHIP_CATEGORIES = [
  {
    roleId: 2,
    label: 'Serving / Retired Engineers',
    icon: 'account-hard-hat-outline',
  },
  {
    roleId: 6,
    label: 'Engineering Students',
    icon: 'school-outline',
  },
  {
    roleId: 5,
    label: 'Organisations / Others',
    icon: 'office-building-outline',
  },
];
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
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [currentFee, setCurrentFee] = useState(null);
  const [fetching, setFetching] = useState(false);

  const [amount, setAmount] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Bounds for the date picker — same wide range style as
  // ActivityFormScreen's activityMinDate/activityMaxDate.
  const today = new Date();
  const feeMinDate = new Date(today.getFullYear() - 100, 0, 1);
  const feeMaxDate = new Date(today.getFullYear() + 80, 11, 31);

  // Re-fetch the current fee for whichever category is selected.
  useEffect(() => {
    if (selectedRoleId) {
      fetchCurrentFee(selectedRoleId);
    } else {
      setCurrentFee(null);
    }
  }, [selectedRoleId]);

  const fetchCurrentFee = async (roleId) => {
    try {
      setFetching(true);
      setCurrentFee(null);
      const res = await api.get(`/payment/current-fee/${roleId}`);
      if (res.data.success) setCurrentFee(res.data.data);
    } catch (e) {
      console.warn('Failed to fetch fee:', e.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSelectCategory = (roleId) => {
    setSelectedRoleId(roleId);
    setAmount('');
    setEffectiveFrom(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    const e = {};
    if (!selectedRoleId) {
      e.category = 'Please select a membership category.';
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      e.amount = 'Please enter a valid fee amount.';
    }
    if (!effectiveFrom) {
      e.effectiveFrom = 'Please select Effective From date.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const categoryLabel = MEMBERSHIP_CATEGORIES.find(c => c.roleId === selectedRoleId)?.label;

    Alert.alert(
      'Confirm',
      `Set ${categoryLabel} membership fee to ₹${amount} effective from ${formatDate(effectiveFrom)}?`,
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
        roleId: selectedRoleId,
        amount: parseFloat(amount),
        effectiveFrom: formatDate(effectiveFrom),
      });
      if (res.data.success) {
        Alert.alert('Success', 'Membership fee updated successfully.');
        setAmount('');
        setEffectiveFrom(null);
        fetchCurrentFee(selectedRoleId);
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

        {/* ── Step 1: Select Membership Category ── */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Select Membership Category</Text>

          {MEMBERSHIP_CATEGORIES.map((cat) => {
            const active = selectedRoleId === cat.roleId;
            return (
              <TouchableOpacity
                key={cat.roleId}
                onPress={() => handleSelectCategory(cat.roleId)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: active ? COLORS.primary : '#E2E8F0',
                  backgroundColor: active ? `${COLORS.primary}12` : '#fff',
                  marginBottom: 10,
                }}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={22}
                  color={active ? COLORS.primary : '#64748B'}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: active ? '700' : '500', color: active ? COLORS.primary : '#334155' }}>
                  {cat.label}
                </Text>
                <MaterialCommunityIcons
                  name={active ? 'radiobox-marked' : 'radiobox-blank'}
                  size={22}
                  color={active ? COLORS.primary : '#CBD5E1'}
                />
              </TouchableOpacity>
            );
          })}
          {!!errors.category && <Text style={styles.field.error}>{errors.category}</Text>}
        </View>

        {/* ── Current Fee Card (for the selected category) ── */}
        {selectedRoleId && (
          <View style={styles.currentCard}>
            <Text style={styles.currentTitle}>
              Current Fee — {MEMBERSHIP_CATEGORIES.find(c => c.roleId === selectedRoleId)?.label}
            </Text>
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
              <Text style={styles.currentDate}>No active fee set for this category</Text>
            )}
          </View>
        )}

        {/* ── Step 2: Set New Fee Form (only once a category is picked) ── */}
        {selectedRoleId && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Set New Fee</Text>

            <Field label="Fee Amount (₹)" required error={errors.amount}>
              <StyledInput
                placeholder="e.g. 1000"
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
                : <Text style={styles.buttonText}>Set Fee for This Category</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SetAnnualFeeScreen;