import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Image, TouchableOpacity, Alert,
} from 'react-native';
import { TextInput, Button, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import { fileService } from '../services/fileService';
import { pickImageFromGallery } from '../utils/imagePicker';

const ProfileEditScreen = ({ navigation }) => {
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [memberId, setMemberId]         = useState(null);
  const [uploadingPhoto, setUploading]  = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [profileData, setProfileData]   = useState({
    fullName: '', email: '', phoneNumber: '', address: '',
    city: '', state: '', pincode: '', designation: '',
    department: '', photoPath: '',
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setMemberId(user.memberId);
        if (user.memberId) {
          const res = await memberService.getProfile(user.memberId);
          if (res.success && res.data) setProfileData(res.data);
        }
      }
    } catch (e) { console.error('Load profile error:', e); }
    finally { setLoading(false); }
  };

  const handleSelectPhoto = async () => {
    const result = await pickImageFromGallery({ aspect: [1, 1] });
    if (!result.success) return;
    setSelectedImage(result.asset);
    setUploading(true);
    try {
      const file = { uri: result.asset.uri, type: 'image/jpeg', name: `profile_${memberId}.jpg` };
      const res  = await fileService.uploadProfilePhoto(file, memberId);
      if (res.success) {
        setProfileData((p) => ({ ...p, photoPath: res.data.filePath }));
        Alert.alert('Success', 'Photo updated.');
      }
    } catch (e) { Alert.alert('Error', 'Photo upload failed.'); }
    finally { setUploading(false); }
  };

  const update = (field, value) => setProfileData((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    if (!profileData.fullName.trim()) { Alert.alert('Error', 'Full name is required.'); return; }
    setSaving(true);
    try {
      const res = await memberService.updateProfile(memberId, profileData);
      if (res.success) {
        Alert.alert('Success', 'Profile updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else { Alert.alert('Error', res.message || 'Update failed.'); }
    } catch (e) { Alert.alert('Error', 'An error occurred.'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1E3A5F" /></View>;

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.photoSection} onPress={handleSelectPhoto} disabled={uploadingPhoto}>
        <View style={styles.photoContainer}>
          {selectedImage?.uri || profileData.photoPath ? (
            <Image source={{ uri: selectedImage?.uri || profileData.photoPath }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitial}>{profileData.fullName?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          {uploadingPhoto && <View style={styles.overlay}><ActivityIndicator color="#fff" /></View>}
        </View>
        <Text style={styles.changePhotoText}>Tap to change photo</Text>
      </TouchableOpacity>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TextInput label="Full Name *" value={profileData.fullName} onChangeText={(v) => update('fullName', v)} mode="outlined" style={styles.input} />
          <TextInput label="Email" value={profileData.email} editable={false} mode="outlined" style={styles.input} disabled />
          <TextInput label="Phone Number" value={profileData.phoneNumber} onChangeText={(v) => update('phoneNumber', v)} mode="outlined" keyboardType="phone-pad" style={styles.input} />
          <TextInput label="Designation" value={profileData.designation} onChangeText={(v) => update('designation', v)} mode="outlined" style={styles.input} />
          <TextInput label="Department" value={profileData.department} onChangeText={(v) => update('department', v)} mode="outlined" style={styles.input} />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Address</Text>
          <TextInput label="Address" value={profileData.address} onChangeText={(v) => update('address', v)} mode="outlined" multiline numberOfLines={3} style={styles.input} />
          <TextInput label="City" value={profileData.city} onChangeText={(v) => update('city', v)} mode="outlined" style={styles.input} />
          <TextInput label="State" value={profileData.state} onChangeText={(v) => update('state', v)} mode="outlined" style={styles.input} />
          <TextInput label="Pincode" value={profileData.pincode} onChangeText={(v) => update('pincode', v)} mode="outlined" keyboardType="numeric" style={styles.input} />
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.btn}>Save Changes</Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} disabled={saving} style={styles.btn}>Cancel</Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoSection: { alignItems: 'center', padding: 20, backgroundColor: '#fff', marginBottom: 12 },
  photoContainer: { position: 'relative' },
  photo: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  photoInitial: { fontSize: 48, color: '#fff', fontWeight: 'bold' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  changePhotoText: { marginTop: 10, color: '#1E3A5F', fontSize: 14 },
  card: { margin: 12, marginTop: 0, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  input: { marginBottom: 10, backgroundColor: '#fff' },
  actions: { padding: 12 },
  btn: { marginBottom: 10 },
});

export default ProfileEditScreen;
