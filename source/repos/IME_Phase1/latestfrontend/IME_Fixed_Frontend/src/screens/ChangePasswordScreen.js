import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';

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
      } else { Alert.alert('Error', res.message || 'Failed to change password.'); }
    } catch (e) { Alert.alert('Error', 'An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Please enter your current and new password.</Text>

          <TextInput label="Current Password" value={currentPassword} onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent} mode="outlined" style={styles.input}
            right={<TextInput.Icon icon={showCurrent ? 'eye-off' : 'eye'} onPress={() => setShowCurrent(!showCurrent)} />}
          />
          <TextInput label="New Password" value={newPassword} onChangeText={setNewPassword}
            secureTextEntry={!showNew} mode="outlined" style={styles.input}
            right={<TextInput.Icon icon={showNew ? 'eye-off' : 'eye'} onPress={() => setShowNew(!showNew)} />}
          />
          <TextInput label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm} mode="outlined" style={styles.input}
            right={<TextInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm(!showConfirm)} />}
          />

          <View style={styles.requirements}>
            <Text style={styles.reqTitle}>Requirements:</Text>
            <Text style={styles.req}>• At least 8 characters</Text>
            <Text style={styles.req}>• Mix of letters and numbers recommended</Text>
          </View>

          <Button mode="contained" onPress={handleChangePassword} loading={loading} disabled={loading} style={styles.btn}>
            Change Password
          </Button>
          <Button mode="outlined" onPress={() => navigation.goBack()} disabled={loading} style={styles.btn}>Cancel</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f5f5f5' },
  card:         { margin: 15, elevation: 2 },
  title:        { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  subtitle:     { fontSize: 13, color: '#666', marginBottom: 18 },
  input:        { marginBottom: 10, backgroundColor: '#fff' },
  requirements: { backgroundColor: '#E3F2FD', padding: 14, borderRadius: 8, marginBottom: 18 },
  reqTitle:     { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  req:          { fontSize: 12, color: '#555', marginBottom: 3 },
  btn:          { marginBottom: 10 },
});

export default ChangePasswordScreen;
