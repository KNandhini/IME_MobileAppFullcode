import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput, Platform, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { Card } from 'react-native-paper';
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

// ── Safe date-of-birth formatter ───────────────────────────────────────────
// Guards against `new Date(x).toLocaleDateString()` throwing a RangeError
// on Hermes/Android when `x` is missing or not a parseable date, which was
// crashing the whole screen (showing as a blank blue page — the root
// container's background color with nothing rendered on top of it).
const formatDob = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleDateString('en-IN');
  } catch {
    return '—';
  }
};

// ── Field wrapper — matches Activity Form ─────────────────────────────────
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

// ── Styled TextInput — matches Activity Form, supports disabled ───────────
function StyledInput({ hasError, multiline, disabled, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.styledInput.base,
        multiline && styles.styledInput.multiline,
        focused && !disabled && styles.styledInput.focused,
        hasError && styles.styledInput.errored,
        disabled && styles.styledInput.disabled,
        style,
      ]}
      placeholderTextColor="#CBD5E1"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={!disabled}
      {...props}
    />
  );
}

// ── Local photo-picker styles — dashed-border row with a circular icon,
// matching the design used in AddAdminScreen. Defined locally here (rather
// than relying on MemberEditScreenStyles) so this doesn't depend on
// screenStyles.js already having these keys defined. ──
const photoPicker = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  preview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCE3FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeholderIcon: {
    fontSize: 20,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  removeBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '600',
  },
});

const MemberEditScreen = ({ route, navigation }) => {
 const { member } = route.params;
const memberId = member.memberId || member.MemberId;
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  //const [member,   setMember]   = useState(null);
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
    setForm({
        fullName: member.fullName || '',
        contactNumber: member.contactNumber || '',
        gender: member.gender || '',
        age: member.age != null ? String(member.age) : '',
        address: member.address || '',
        place: member.place || '',
        designationId: member.designationId ?? 1,
    });

    const blob =
        member.profilePhoto ??
        member.ProfilePhoto ??
        member.photo ??
        member.Photo;

    if (blob) {
        setResolvedPhotoUri(blobToDataUri(blob));
    } else if (member.profilePhotoPath) {
        setResolvedPhotoUri(
            member.profilePhotoPath.startsWith('http')
                ? member.profilePhotoPath
                : `${BASE_URL}/${member.profilePhotoPath}`
        );
    }

    setLoading(false);
}, []);

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
         email:           member?.email ?? undefined,
        contactNumber:   form.contactNumber.trim(),
        gender:          form.gender,
        age:             form.age ? parseInt(form.age, 10) : 0,
        address:         form.address.trim(),
        place:           form.place.trim(),
        designationId:   form.designationId,
         dateOfBirth:     member?.dateOfBirth ?? undefined, 
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
  const photoSource = newPhoto
    ? { uri: newPhoto.uri }
    : resolvedPhotoUri
      ? { uri: resolvedPhotoUri }
      : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Top navbar — same as Activity Form ── */}
      <GradientHeader style={styles.navbar}>
        <TouchableOpacity onPress={handleClear} style={styles.navSide} disabled={saving}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Member</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={COLORS.accent} />
            : <Text style={styles.navSave}>Update</Text>}
        </TouchableOpacity>
      </GradientHeader>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Member Info (read-only, shown as disabled textboxes) ── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Member Info</Text>

            <Field label="Email">
              <StyledInput
                value={member?.email || ''}
                editable={false}
                disabled
              />
            </Field>

            <Field label="Date of Birth">
              <StyledInput
                value={formatDob(member?.dateOfBirth)}
                editable={false}
                disabled
              />
            </Field>

            <Field label="Status">
              <StyledInput
                value={member?.membershipStatus || '—'}
                editable={false}
                disabled
              />
            </Field>
          </Card.Content>
        </Card>

        {/* ── Personal Details ── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <Field label="Full Name" required error={errors.fullName}>
              <StyledInput
                placeholder="Full name"
                value={form.fullName}
                onChangeText={v => {
                  setForm(p => ({ ...p, fullName: v.replace(/[^A-Za-z\s]/g, '').slice(0, 150) }));
                  if (errors.fullName) setErrors(p => ({ ...p, fullName: null }));
                }}
                hasError={!!errors.fullName}
                returnKeyType="next"
              />
            </Field>

            <Field label="Contact Number" error={errors.contactNumber}>
              <StyledInput
                placeholder="10-digit mobile number"
                value={form.contactNumber}
                onChangeText={v => {
                  setForm(p => ({ ...p, contactNumber: v.replace(/[^0-9]/g, '').slice(0, 10) }));
                  if (errors.contactNumber) setErrors(p => ({ ...p, contactNumber: null }));
                }}
                hasError={!!errors.contactNumber}
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="next"
              />
            </Field>

            <Field label="Gender">
              <TouchableOpacity
                style={[styles.styledInput.base, styles.dropdown]}
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
              <StyledInput
                placeholder="Age"
                value={form.age}
                onChangeText={v => setForm(p => ({ ...p, age: v.replace(/[^0-9]/g, '').slice(0, 3) }))}
                keyboardType="numeric"
                maxLength={3}
                returnKeyType="next"
              />
            </Field>

            <Field label="Address">
              <StyledInput
                placeholder="Address"
                value={form.address}
                onChangeText={v => setForm(p => ({ ...p, address: v.slice(0, 250) }))}
                multiline
              />
            </Field>

            <Field label="Place">
              <StyledInput
                placeholder="City / Town"
                value={form.place}
                onChangeText={v => setForm(p => ({ ...p, place: v.replace(/[^A-Za-z\s]/g, '').slice(0, 50) }))}
                returnKeyType="done"
              />
            </Field>
          </Card.Content>
        </Card>

        {/* ── Profile Photo — dashed-border circular picker row, matching AddAdminScreen ── */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Profile Photo (Optional)</Text>

            <TouchableOpacity style={photoPicker.row} onPress={handlePickPhoto} activeOpacity={0.8}>
              {photoSource ? (
                <Image source={photoSource} style={photoPicker.preview} />
              ) : (
                <View style={photoPicker.placeholder}>
                  <Text style={photoPicker.placeholderIcon}>👤</Text>
                </View>
              )}
              <View style={photoPicker.textWrap}>
                <Text style={photoPicker.title}>
                  {photoSource ? 'Photo selected' : 'Upload profile photo'}
                </Text>
                <Text style={photoPicker.hint}>
                  {photoSource ? 'Tap to change' : 'Tap to choose from gallery'}
                </Text>
              </View>
            </TouchableOpacity>

            {/*{photoSource && (
              <TouchableOpacity
                style={photoPicker.removeBtn}
                onPress={() => { setNewPhoto(null); setResolvedPhotoUri(null); }}
              >
                <Text style={photoPicker.removeText}>Remove photo</Text>
              </TouchableOpacity>
            )}*/}
          </Card.Content>
        </Card>

        <View style={{ height: 32 }} />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default MemberEditScreen;