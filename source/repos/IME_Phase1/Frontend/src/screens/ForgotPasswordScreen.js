import React, { useState } from 'react';
import { View, Text, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { authService } from '../services/authService';
import { ForgotPasswordScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

// ── Field wrapper — matches Achievement/JobPosting/Club ──
function Field({ label, children, error }) {
  return (
    <View style={styles.field.wrapper}>
      <Text style={styles.field.label}>{label}</Text>
      {children}
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

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: validation, 2: reset
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    if (!email || !dateOfBirth) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email, dateOfBirth);

      if (response.success) {
        setUserId(response.data.userId);
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
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

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
            <Field label="Email">
              <StyledInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Date of Birth" hint="Format: YYYY-MM-DD">
              <StyledInput
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="2000-01-01"
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
            <Field label="New Password">
              <StyledInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </Field>

            <Field label="Confirm Password">
              <StyledInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
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