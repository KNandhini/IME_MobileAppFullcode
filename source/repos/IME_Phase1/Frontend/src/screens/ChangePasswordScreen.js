import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import IMELogo from '../components/IMELogo';
import { memberService } from '../services/memberService';
import { ChangePasswordScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

// ── Field wrapper — matches Achievement/JobPosting/Club ──
function Field({ label, required, children, error, hint }) {
  return (
    <View style={styles.field.wrapper}>
      <View style={styles.field.labelRow}>
        <Text style={styles.field.label}>
          {label}{required && <Text style={styles.field.req}> *</Text>}
        </Text>
      </View>
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

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = (key) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = () => {
    const e = {};
    if (!currentPassword.trim()) e.currentPassword = 'Current password is required';

    if (!newPassword) e.newPassword = 'New password is required';
    else if (newPassword.length < 8) e.newPassword = 'New password must be at least 8 characters';

    if (!confirmPassword) e.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) e.confirmPassword = 'New passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (!userStr) { Alert.alert('Error', 'Session expired. Please login again.'); return; }
      const user = JSON.parse(userStr);
      const res = await memberService.changePassword(user.memberId, { currentPassword, newPassword });
      if (res.success) {
        Alert.alert('Success', 'Password changed successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else { Alert.alert('Error', getSafeErrorMessage(res)); }
    } catch (e) { Alert.alert('Error', 'An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <LinearGradient
      colors={[COLORS.headerStart, COLORS.headerEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* ── Top navbar ── */}
      <GradientHeader style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide} disabled={loading}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Change Password</Text>
        <TouchableOpacity onPress={handleChangePassword} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={COLORS.accent} />
            : <Text style={styles.navSave}>Save</Text>}
        </TouchableOpacity>
      </GradientHeader>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {/* ── Logo ── */}
          <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
            <IMELogo size="small" animated={false} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Please enter your current and new password.</Text>

            <PasswordField
              label="Current Password"
              required
              value={currentPassword}
              onChangeText={(t) => { setCurrentPassword(t); clearError('currentPassword'); }}
              error={errors.currentPassword}
              visible={showCurrent}
              onToggleVisible={() => setShowCurrent(!showCurrent)}
            />
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
              label="Confirm New Password"
              required
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
              error={errors.confirmPassword}
              visible={showConfirm}
              onToggleVisible={() => setShowConfirm(!showConfirm)}
            />

            <View style={styles.requirements}>
              <Text style={styles.reqTitle}>Requirements</Text>
              <Text style={styles.req}>• At least 8 characters</Text>
              <Text style={styles.req}>• Mix of letters and numbers recommended</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ChangePasswordScreen;