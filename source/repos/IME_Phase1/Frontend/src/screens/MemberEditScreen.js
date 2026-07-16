import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import { BASE_URL } from '../utils/api';
import { MemberEditScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const GENDERS = ['Male', 'Female', 'Other'];

// ── same helper used in AchievementsScreen ────────────────────────────────────
const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (typeof blob === 'string' && blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

const MemberEditScreen = ({ route, navigation }) => {
  const { memberId } = route.params;

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [member,   setMember]   = useState(null);
  const [newPhoto, setNewPhoto] = useState(null); // { uri, fileName, mimeType }
  const [genderOpen, setGenderOpen] = useState(false);

  // resolved photo URI (blob-based, same as AchievementsScreen)
  const [resolvedPhotoUri, setResolvedPhotoUri] = useState(null);

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

          // ── Resolve photo the same way AchievementsScreen does ──────────────
          // Priority 1: profilePhoto blob (base64) field
          const blob =
            d.profilePhoto ?? d.ProfilePhoto ?? d.photo ?? d.Photo ?? null;
          if (blob) {
            setResolvedPhotoUri(blobToDataUri(blob));
          } else if (d.profilePhotoPath) {
            // Fallback: URL path
            const uri = d.profilePhotoPath.startsWith('http')
              ? d.profilePhotoPath
              : `${BASE_URL}/${d.profilePhotoPath}`;
            setResolvedPhotoUri(uri);
          }
        } else {
          Alert.alert('Error', getSafeErrorMessage(res));
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
      allowsEditing: false,
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
    const e = {};
    if (!form.fullName.trim()) {
      e.fullName = 'Full name is required.';
    }
    if (form.contactNumber && !/^[0-9]{10}$/.test(form.contactNumber)) {
      e.contactNumber = 'Contact number must be 10 digits.';
    }
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      if (newPhoto) {
        await uploadPhoto();
      }

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
        Alert.alert('Error', getSafeErrorMessage(res));
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Clear – go back without saving ───────────────────────
  const handleClear = () => navigation.goBack();

  // ── Current photo source ──────────────────────────────────
  // newPhoto (just picked) takes priority, then blob-resolved URI
  const photoSource = newPhoto
    ? { uri: newPhoto.uri }
    : resolvedPhotoUri
      ? { uri: resolvedPhotoUri }
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
      <Field label="Full Name *" error={errors.fullName}>
        <TextInput
          style={styles.input}
          value={form.fullName}
          onChangeText={v => { setForm(p => ({ ...p, fullName: v.replace(/[^A-Za-z\s]/g, '').slice(0, 150) })); if (errors.fullName) setErrors(p => ({ ...p, fullName: null })); }}
          placeholder="Full name"
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label="Contact Number" error={errors.contactNumber}>
        <TextInput
          style={styles.input}
          value={form.contactNumber}
          onChangeText={v => { setForm(p => ({ ...p, contactNumber: v.replace(/[^0-9]/g, '').slice(0, 10) })); if (errors.contactNumber) setErrors(p => ({ ...p, contactNumber: null })); }}
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

      {/* ── Action buttons ── */}
      <View style={styles.buttonRow}>
        {/* Clear / Cancel */}
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClear}
          activeOpacity={0.8}
        >
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>

        {/* Save */}
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
      </View>

    </ScrollView>
  );
};

const Field = ({ label, children, error }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);



export default MemberEditScreen;