import React, { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { authService } from '../services/authService';
import { ForgotPasswordScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

// ── Field wrapper — matches Achievement/JobPosting/Club ──
function Field({ label, required, children, error, hint }) {
  return (
    <View style={styles.field.wrapper}>
      <Text style={styles.field.label}>
        {label}{required && <Text style={styles.field.req}> *</Text>}
      </Text>
      {children}
      {!!hint && !error && <Text style={styles.field.hint}>{hint}</Text>}
      {!!error && <Text style={styles.field.error}>{error}</Text>}
    </View>
  );
}

// ── Styled TextInput — matches Achievement/JobPosting/Club ──
function StyledInput({ hasError, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.styledInput.base,
        focused && styles.styledInput.focused,
        hasError && styles.styledInput.errored,
        style,
      ]}
      placeholderTextColor="#CBD5E1"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  );
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
const DOB_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: validation, 2: reset
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = (key) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validateStep1 = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email)) e.email = 'Please enter a valid email address';

    if (!dateOfBirth.trim()) {
      e.dateOfBirth = 'Date of birth is required';
    } else if (!DOB_REGEX.test(dateOfBirth)) {
      e.dateOfBirth = 'Please enter a valid date in YYYY-MM-DD format';
    } else {
      const d = new Date(dateOfBirth);
      if (isNaN(d.getTime())) {
        e.dateOfBirth = 'Please enter a valid date of birth';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!newPassword) e.newPassword = 'New password is required';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (newPassword && newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleValidate = async () => {
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email, dateOfBirth);

      if (response.success) {
        setUserId(response.data.userId);
        setErrors({});
        setStep(2);
      } else {
        Alert.alert('Validation Failed', getSafeErrorMessage(response));
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await authService.resetPassword(userId, newPassword);

      if (response.success) {
        Alert.alert('Success', 'Password reset successful', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Failed', getSafeErrorMessage(response));
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your details to validate'
              : 'Enter new password'}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <Field label="Email" required error={errors.email}>
              <StyledInput
                value={email}
                onChangeText={(t) => { setEmail(t); clearError('email'); }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                hasError={!!errors.email}
              />
            </Field>

            <Field label="Date of Birth" required hint="Format: YYYY-MM-DD" error={errors.dateOfBirth}>
              <StyledInput
                value={dateOfBirth}
                onChangeText={(t) => { setDateOfBirth(t); clearError('dateOfBirth'); }}
                placeholder="2000-01-01"
                hasError={!!errors.dateOfBirth}
              />
            </Field>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleValidate}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#D4A017" />
                : <Text style={styles.buttonText}>Validate</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Field label="New Password" required error={errors.newPassword}>
              <StyledInput
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); clearError('newPassword'); }}
                secureTextEntry
                hasError={!!errors.newPassword}
              />
            </Field>

            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <StyledInput
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                secureTextEntry
                hasError={!!errors.confirmPassword}
              />
            </Field>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#D4A017" />
                : <Text style={styles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkButtonText}>Back to Login</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

export default ForgotPasswordScreen;