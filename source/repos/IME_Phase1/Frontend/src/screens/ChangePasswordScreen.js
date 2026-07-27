import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
function PasswordField({ label, value, onChangeText, visible, onToggleVisible }) {
  return (
    <Field label={label}>
      <View style={{ position: 'relative' }}>
        <StyledInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          style={{ paddingRight: 44 }}
        />
        <TouchableOpacity
          onPress={onToggleVisible}
          style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Field>
  );
}

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]                 = useState(false);
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) { Alert.alert('Error', 'Enter your current password.'); return; }
    if (newPassword.length < 8)  { Alert.alert('Error', 'New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'New passwords do not match.'); return; }

    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (!userStr) { Alert.alert('Error', 'Session expired. Please login again.'); return; }
      const user = JSON.parse(userStr);
      const res  = await memberService.changePassword(user.memberId, { currentPassword, newPassword });
      if (res.success) {
        Alert.alert('Success', 'Password changed successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else { Alert.alert('Error', getSafeErrorMessage(res)); }
    } catch (e) { Alert.alert('Error', 'An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      {/* ── Top navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide} disabled={loading}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Change Password</Text>
        <TouchableOpacity onPress={handleChangePassword} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#D4A017" />
            : <Text style={styles.navSave}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
  <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
    <View style={styles.card}>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>Please enter your current and new password.</Text>

      <PasswordField
        label="Current Password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        visible={showCurrent}
        onToggleVisible={() => setShowCurrent(!showCurrent)}
      />
      <PasswordField
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        visible={showNew}
        onToggleVisible={() => setShowNew(!showNew)}
      />
      <PasswordField
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
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
    </View>
  );
};

export default ChangePasswordScreen;