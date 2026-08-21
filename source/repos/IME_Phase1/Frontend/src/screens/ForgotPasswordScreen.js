import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import IMELogo from '../components/IMELogo';
import { authService } from '../services/authService';
import { ForgotPasswordScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import DOBField from '../components/DOBField';

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

// ── Password field — StyledInput with an eye toggle overlaid on the right ──
// (same pattern as ChangePasswordScreen)
function PasswordField({ label, required, value, onChangeText, error, hint, visible, onToggleVisible }) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <View style={{ position: 'relative' }}>
        <StyledInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          hasError={!!error}
          style={{ paddingRight: 44 }}
        />
        <TouchableOpacity
          onPress={onToggleVisible}
          style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.placeholder} />
        </TouchableOpacity>
      </View>
    </Field>
  );
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  // Date of birth: selectedDob drives the DOBField UI (Date object),
  // dateOfBirth is the 'YYYY-MM-DD' string sent to the API.
  const [selectedDob, setSelectedDob] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState(1); // 1: validation, 2: reset
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const today = new Date();
  const minDob = new Date();
  minDob.setFullYear(today.getFullYear() - 80);

  const clearError = (key) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const formatYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const validateStep1 = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email)) e.email = 'Please enter a valid email address';

    if (!dateOfBirth) {
      e.dateOfBirth = 'Date of birth is required';
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
    <LinearGradient
      colors={[COLORS.headerStart, COLORS.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { backgroundColor: 'transparent', justifyContent: 'flex-start', padding: 0 },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ── */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <IMELogo size="medium" animated={false} />
          </View>

          <View style={styles.card}>

            <View style={styles.header}>
              <Text style={styles.title}>{step === 1 ? 'Forgot Password' : 'Change Password'}</Text>
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

                <DOBField
                  label="Date of Birth"
                  required
                  value={selectedDob}
                  minDate={minDob}
                  maxDate={today}
                  error={errors.dateOfBirth}
                  FieldComponent={Field}
                  InputComponent={StyledInput}
                  onChange={(date) => {
                    setSelectedDob(date);
                    setDateOfBirth(formatYMD(date));
                    clearError('dateOfBirth');
                  }}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleValidate}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={COLORS.accent} />
                    : <Text style={styles.buttonText}>Validate</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <PasswordField
                  label="New Password"
                  required
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); clearError('newPassword'); }}
                  error={errors.newPassword}
                  visible={showNew}
                  onToggleVisible={() => setShowNew(!showNew)}
                />

                <PasswordField
                  label="Confirm Password"
                  required
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                  error={errors.confirmPassword}
                  visible={showConfirm}
                  onToggleVisible={() => setShowConfirm(!showConfirm)}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color={COLORS.accent} />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;