import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, TextInput, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import { BASE_URL } from '../utils/api';

const GENDERS = ['Male', 'Female', 'Other'];

const MemberEditScreen = ({ route, navigation }) => {
  const { memberId } = route.params;

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [member,   setMember]   = useState(null);
  const [newPhoto, setNewPhoto] = useState(null); // { uri, fileName, mimeType }
  const [genderOpen, setGenderOpen] = useState(false);

  const [form, setForm] = useState({
    fullName:      '',
    contactNumber: '',
    gender:        '',
    age:           '',
    address:       '',
    place:         '',
    designationId: 1,
  });

  // ── Load member profile ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await memberService.getProfile(memberId);
        if (res.success && res.data) {
          const d = res.data;
          setMember(d);
          setForm({
            fullName:      d.fullName      || '',
            contactNumber: d.contactNumber || '',
            gender:        d.gender        || '',
            age:           d.age != null   ? String(d.age) : '',
            address:       d.address       || '',
            place:         d.place         || '',
            designationId: d.designationId ?? 1,
          });
        } else {
          Alert.alert('Error', res.message || 'Failed to load member');
          navigation.goBack();
        }
      } catch {
        Alert.alert('Error', 'Failed to load member');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId]);

  // ── Pick new photo ────────────────────────────────────────
  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photo library to change profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setNewPhoto({
        uri:      asset.uri,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    }
  }, []);

  // ── Upload photo to server ────────────────────────────────
  const uploadPhoto = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('file', {
      uri:  newPhoto.uri,
      name: newPhoto.fileName,
      type: newPhoto.mimeType,
    });
    formData.append('memberId', String(memberId));

    const res = await fetch(`${BASE_URL}/api/file/upload-profile-photo`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Photo upload failed: ${text}`);
    }
    return res.json();
  };

  // ── Save ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Validation', 'Full name is required.');
      return;
    }
    if (form.contactNumber && !/^[0-9]{10}$/.test(form.contactNumber)) {
      Alert.alert('Validation', 'Contact number must be 10 digits.');
      return;
    }

    setSaving(true);
    try {
      // Upload new photo first if selected
      if (newPhoto) {
        await uploadPhoto();
      }

      // Update profile details
      const payload = {
        fullName:        form.fullName.trim(),
        contactNumber:   form.contactNumber.trim(),
        gender:          form.gender,
        age:             form.age ? parseInt(form.age, 10) : 0,
        address:         form.address.trim(),
        place:           form.place.trim(),
        designationId:   form.designationId,
        profilePhotoPath: member?.profilePhotoPath ?? null,
      };

      const res = await memberService.updateProfile(memberId, payload);
      if (res.success) {
        Alert.alert('Success', 'Member updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to update member.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // ── Current photo source ──────────────────────────────────
  const photoSource = newPhoto
    ? { uri: newPhoto.uri }
    : member?.profilePhotoPath
      ? { uri: member.profilePhotoPath.startsWith('http')
            ? member.profilePhotoPath
            : `${BASE_URL}/${member.profilePhotoPath}` }
      : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* ── Photo ── */}
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
          {photoSource ? (
            <Image source={photoSource} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitial}>
                {form.fullName ? form.fullName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to change profile photo</Text>
      </View>

      {/* ── Read-only info ── */}
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyLabel}>Email</Text>
        <Text style={styles.readOnlyValue}>{member?.email}</Text>
        <Text style={[styles.readOnlyLabel, { marginTop: 8 }]}>Date of Birth</Text>
        <Text style={styles.readOnlyValue}>
          {member?.dateOfBirth
            ? new Date(member.dateOfBirth).toLocaleDateString('en-IN')
            : '—'}
        </Text>
        <Text style={[styles.readOnlyLabel, { marginTop: 8 }]}>Status</Text>
        <Text style={styles.readOnlyValue}>{member?.membershipStatus}</Text>
      </View>

      {/* ── Editable fields ── */}
      <Field label="Full Name *">
        <TextInput
          style={styles.input}
          value={form.fullName}
          onChangeText={v => setForm(p => ({ ...p, fullName: v.replace(/[^A-Za-z\s]/g, '').slice(0, 150) }))}
          placeholder="Full name"
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label="Contact Number">
        <TextInput
          style={styles.input}
          value={form.contactNumber}
          onChangeText={v => setForm(p => ({ ...p, contactNumber: v.replace(/[^0-9]/g, '').slice(0, 10) }))}
          placeholder="10-digit mobile number"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={10}
        />
      </Field>

      <Field label="Gender">
        <TouchableOpacity
          style={[styles.input, styles.dropdown]}
          onPress={() => setGenderOpen(o => !o)}
          activeOpacity={0.8}
        >
          <Text style={form.gender ? styles.dropdownSelected : styles.dropdownPlaceholder}>
            {form.gender || 'Select gender'}
          </Text>
          <Text style={styles.dropdownArrow}>{genderOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {genderOpen && (
          <View style={styles.dropdownMenu}>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={styles.dropdownItem}
                onPress={() => { setForm(p => ({ ...p, gender: g })); setGenderOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, form.gender === g && styles.dropdownItemActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Field>

      <Field label="Age">
        <TextInput
          style={styles.input}
          value={form.age}
          onChangeText={v => setForm(p => ({ ...p, age: v.replace(/[^0-9]/g, '').slice(0, 3) }))}
          placeholder="Age"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          maxLength={3}
        />
      </Field>

      <Field label="Address">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.address}
          onChangeText={v => setForm(p => ({ ...p, address: v.slice(0, 250) }))}
          placeholder="Address"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Field>

      <Field label="Place">
        <TextInput
          style={styles.input}
          value={form.place}
          onChangeText={v => setForm(p => ({ ...p, place: v.replace(/[^A-Za-z\s]/g, '').slice(0, 50) }))}
          placeholder="City / Town"
          placeholderTextColor="#aaa"
        />
      </Field>

      {/* ── Save button ── */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.saveBtnText}>Save Changes</Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
};

const Field = ({ label, children }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Photo
  photoSection:    { alignItems: 'center', marginBottom: 20 },
  photo:           { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#1E3A5F' },
  photoPlaceholder:{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  photoInitial:    { fontSize: 38, color: '#fff', fontWeight: '700' },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#D4A017', borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  cameraIcon:  { fontSize: 14 },
  photoHint:   { marginTop: 8, fontSize: 12, color: '#888' },

  // Read-only
  readOnlyBox:   { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, elevation: 1 },
  readOnlyLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },
  readOnlyValue: { fontSize: 14, color: '#333', fontWeight: '600', marginTop: 2 },

  // Form
  field:  { marginBottom: 14 },
  label:  { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: '#222',
  },
  multiline: { minHeight: 80, paddingTop: 12 },

  // Gender dropdown
  dropdown:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownSelected:  { fontSize: 15, color: '#222' },
  dropdownPlaceholder:{ fontSize: 15, color: '#aaa' },
  dropdownArrow:     { fontSize: 12, color: '#888' },
  dropdownMenu:      { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginTop: 4, overflow: 'hidden' },
  dropdownItem:      { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownItemText:  { fontSize: 15, color: '#333' },
  dropdownItemActive:{ color: '#1E3A5F', fontWeight: '700' },

  // Save
  saveBtn: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default MemberEditScreen;
