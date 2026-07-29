import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal, Image, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { clubService } from '../services/clubService';
import { AddAdminScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { COLORS } from './theme'; // ← adjust this path to wherever COLORS actually lives
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Local color constants — GOLD/NAVY are only defined inside the
// AddAdminScreenStyles closure, so the component needs its own copy.
const NAVY = COLORS.navy;
const GOLD = COLORS.gold;

// ── Field wrapper — local styles.field (own copy, matches Activity Form) ──
function Field({ label, required, children, error, hint, charCount, maxChars }) {
  const over = maxChars != null && charCount > maxChars;
  return (
    <View style={styles.field.wrapper}>
      <View style={styles.field.labelRow}>
        <Text style={styles.field.label}>
          {label}{required && <Text style={styles.field.req}> *</Text>}
        </Text>
        {maxChars != null && (
          <Text style={[styles.field.counter, over && styles.field.counterOver]}>
            {charCount ?? 0}/{maxChars}
          </Text>
        )}
      </View>
      {children}
      {!!hint && !error && <Text style={styles.field.hint}>{hint}</Text>}
      {!!error && <Text style={styles.field.error}>{error}</Text>}
    </View>
  );
}

// ── Styled TextInput — local styles.styledInput (own copy, matches Activity Form) ──
function StyledInput({ hasError, multiline, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.styledInput.base,
        multiline && styles.styledInput.multiline,
        focused && styles.styledInput.focused,
        hasError && styles.styledInput.errored,
        style,
      ]}
      placeholderTextColor="#CBD5E1"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
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
          <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Field>
  );
}

// ── Select-style field — read-only StyledInput that opens a modal/menu/picker ──
function SelectField({ label, required, value, placeholder, onPress, error, disabled, loading, multiline }) {
  return (
    <Field label={label} required={required} error={error}>
      <TouchableOpacity onPress={disabled ? undefined : onPress} activeOpacity={0.8} disabled={disabled}>
        <View pointerEvents="none">
          <StyledInput
            value={value}
            placeholder={loading ? 'Loading…' : placeholder}
            editable={false}
            multiline={multiline}
            hasError={!!error}
            style={disabled ? { opacity: 0.5 } : null}
          />
        </View>
      </TouchableOpacity>
    </Field>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AdminSignupScreen
// Same form shape as SignupScreen, but:
//   • No "welcome / grace-period / fee" modal
//   • No RegistrationPayment navigation
//   • Sends roleId = 1 (Admin) instead of the default member roleId
//   • Lets you pick a SINGLE club (an admin manages one club)
//   • Uploads the picked profile photo directly to /File/upload-profile-photo
//     right after signup succeeds, using the new memberId
//   • Occupation + Educational Qualification fields (same shape as SignupScreen)
// ─────────────────────────────────────────────────────────────────────────
const AdminSignupScreen = ({
  navigation,
  route
}) => {
  const hideClubSelection =
    route?.params?.hideClubSelection || false;

  const presetClub =
    route?.params?.presetClub || null;
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    contactNumber: '', address: '', gender: '', age: '',
    dateOfBirth: '', designationId: 1, // TODO: point at your actual "Admin" designation id if you have one
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // ── Location state ─────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [clubModal, setClubModal] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null); // { countryId, countryName }
  const [selectedState, setSelectedState] = useState(null); // { stateId, stateName }
  const [selectedClub, setSelectedClub] = useState(null);   // { clubId, clubName } — SINGLE

  const [statesLoading, setStatesLoading] = useState(false);
  const [clubsLoading, setClubsLoading] = useState(false);

  // ── Occupation state ───────────────────────────────────────────────────────
  const OCCUPATION_OPTIONS = ['Employed', 'Self Employed', 'Unemployed'];
  const [occupation, setOccupation] = useState('');
  const [occupationMenuVisible, setOccupationMenuVisible] = useState(false);
  const [occupationMenuWidth, setOccupationMenuWidth] = useState(0);

  // ── Occupation Details state (shown for Employed / Self Employed) ─────────
  const [occupationDetails, setOccupationDetails] = useState(''); // free-text: role, company/business, etc.

  // ── Educational Qualification state (always shown once occupation chosen) ─
  const [qualification, setQualification] = useState(''); // free-text

  // Derived visibility flags — recompute on every render, no refresh needed
  const showOccupationDetails = occupation === 'Employed' || occupation === 'Self Employed';
  const showEducationSection = occupation === 'Employed' || occupation === 'Self Employed' || occupation === 'Unemployed';

  useEffect(() => {
    if (hideClubSelection && presetClub) {
      setSelectedClub({
        clubId: presetClub.clubId,
        clubName: presetClub.clubName,
      });
    }
  }, [hideClubSelection, presetClub]);
  useEffect(() => { loadCountries(); }, []);

  const loadCountries = async () => {
    try {
      const res = await clubService.getCountries();
      if (res.success) setCountries(res.data || []);
    } catch (e) {
      console.warn('Countries fetch failed:', e.message);
    }
  };

  const loadStates = async (countryId) => {
    setStatesLoading(true);
    setStates([]);
    setSelectedState(null);
    setSelectedClub(null);
    setClubs([]);
    try {
      const res = await clubService.getStatesByCountry(countryId);
      if (res.success) setStates(res.data || []);
    } catch (e) {
      console.warn('States fetch failed:', e.message);
    } finally {
      setStatesLoading(false);
    }
  };

  const loadClubsByState = async (stateId) => {
    setClubsLoading(true);
    setClubs([]);
    setSelectedClub(null);
    try {
      const res = await clubService.getAll(1, 200, '', true);
      if (res.success && res.data) {
        const filtered = res.data.filter((c) => c.stateId === stateId);
        setClubs(filtered);
      }
    } catch (e) {
      console.warn('Clubs fetch failed:', e.message);
    } finally {
      setClubsLoading(false);
    }
  };

  const selectClub = (club) => {
    setSelectedClub(club);
    setClubModal(false);
  };

  // Clears whatever is no longer relevant when the occupation selection changes,
  // so stale data from a previous choice never gets silently submitted.
  const handleOccupationSelect = (value) => {
    setOccupation(value);
    setOccupationMenuVisible(false);
    if (value !== 'Employed' && value !== 'Self Employed') {
      setOccupationDetails('');
    }
    setErrors((prev) => ({
      ...prev,
      occupation: undefined,
      occupationDetails: undefined,
    }));
  };

  const updateField = (field, value) => {
    let v = value;
    if (field === 'fullName') v = value.replace(/[^A-Za-z\s]/g, '').slice(0, 150);
    else if (field === 'email') v = value.slice(0, 100);
    else if (field === 'contactNumber') v = value.replace(/[^0-9]/g, '').slice(0, 10);
    else if (field === 'age') v = value.replace(/[^0-9]/g, '').slice(0, 3);
    else if (field === 'address') v = value.replace(/[^A-Za-z0-9\s,./-]/g, '').slice(0, 250);
    setFormData((prev) => ({ ...prev, [field]: v }));
  };

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 80);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calculateAge = (dateOfBirth) => {
    const todayDate = new Date();
    let age = todayDate.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = todayDate.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && todayDate.getDate() < dateOfBirth.getDate())) {
      age -= 1;
    }

    return String(Math.max(age, 0));
  };

  // Lets the user type the DOB directly (auto-formats digits as YYYY-MM-DD)
  // in addition to picking it from the calendar. Age is recalculated once a
  // full, valid date has been typed.
  const handleDOBTextChange = (text) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    if (digits.length > 6) formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;

    setFormData((prev) => ({ ...prev, dateOfBirth: formatted }));
    setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));

    if (digits.length === 8) {
      const y = parseInt(digits.slice(0, 4), 10);
      const m = parseInt(digits.slice(4, 6), 10);
      const d = parseInt(digits.slice(6, 8), 10);
      const parsed = new Date(y, m - 1, d);
      const isRealDate = parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;

      if (isRealDate && parsed >= minDate && parsed <= today) {
        setSelectedDate(parsed);
        setFormData((prev) => ({ ...prev, dateOfBirth: formatted, age: calculateAge(parsed) }));
      } else {
        setErrors((prev) => ({ ...prev, dateOfBirth: 'Enter a valid date of birth' }));
      }
    }
  };

  const validate = () => {
    let e = {};
    if (!formData.fullName) e.fullName = 'Name is required';
    if (!formData.email) e.email = 'Email is required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.password) e.password = 'Password is required';
    else if (!/^(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(formData.password)) e.password = 'Min 6 chars, 1 number & 1 special char';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!formData.contactNumber) e.contactNumber = 'Contact number is required';
    else if (!/^[0-9]{10}$/.test(formData.contactNumber)) e.contactNumber = 'Must be 10 digits';
    if (!formData.address) e.address = 'Address is required';
    if (!formData.gender) e.gender = 'Gender is required';
    if (!formData.age) e.age = 'Age is required';
    if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) e.dateOfBirth = 'Enter date as YYYY-MM-DD';
    else {
      const dob = new Date(formData.dateOfBirth);
      if (isNaN(dob.getTime()) || dob > today || dob < minDate) e.dateOfBirth = 'Enter a valid date of birth';
    }
    if (!selectedCountry) e.country = 'Country is required';
    if (!selectedState) e.state = 'State is required';
    if (!hideClubSelection && !selectedClub) e.club = 'Please select a club';

    // ── Occupation ──
    if (!occupation) e.occupation = 'Occupation is required';

    if (showOccupationDetails) {
      if (!occupationDetails) e.occupationDetails = 'Occupation details are required';
    }

    // ── Educational Qualification ──
    if (showEducationSection) {
      if (!qualification) e.qualification = 'Educational qualification is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setProfilePhoto(result.assets[0]);
    }
  };

  // Uploads the picked photo for a specific member. Called after signup
  // succeeds and we have a real memberId to attach the photo to.
  const uploadProfilePhoto = async (memberId, photoUri) => {
    try {
      debugger;
      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: 'profile_photo.jpg',
        type: 'image/jpeg',
      });
      formData.append('memberId', memberId.toString());

      const baseUrl = api.defaults.baseURL;
      const response = await fetch(`${baseUrl}/File/upload-profile-photo`, {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      return json.success;
    } catch (e) {
      console.warn('Profile photo upload failed:', e.message);
      return false;
    }
  };

const handleSignup = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      contactNumber: formData.contactNumber,
      address: formData.address,
      gender: formData.gender,
      age: parseInt(formData.age),
      dateOfBirth: formData.dateOfBirth,
      designationId: formData.designationId,
      countryId: selectedCountry?.countryId ?? null,
      stateId: selectedState?.stateId ?? null,
      clubId: selectedClub ? String(selectedClub.clubId) : (presetClub ? String(presetClub.clubId) : null),
      roleId: 1,
      occupation,
      ...(showOccupationDetails && { occupationDetails }),
      ...(showEducationSection && { qualification }),
    };

    const response = await api.post('/Auth/signup', payload);
    debugger;
    const res = response.data;

    if (res.success) {
      if (profilePhoto && res.data?.memberId) {
        const uploaded = await uploadProfilePhoto(res.data.memberId, profilePhoto.uri);
        if (!uploaded) {
          console.warn('Profile photo upload did not succeed for member', res.data.memberId);
        }
      }

      const clubName = selectedClub?.clubName || presetClub?.clubName || '';

      const newMember = {
        memberId: res.data.memberId,
        fullName: formData.fullName,
      };

      Alert.alert(
        'Admin Created',
        clubName
          ? `${formData.fullName} has been registered as an admin for ${clubName}.`
          : `${formData.fullName} has been registered as an admin.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (hideClubSelection) {
                debugger;
                // Club field was hidden — this signup was triggered from an
                // existing club's "add admin" flow, so return to that same club.
                navigation.navigate({
                  name: 'ClubForm',
                  params: {
                    clubId: presetClub?.clubId,
                    newAdminMember: newMember,
                  },
                  merge: true,
                });
              } else {
                debugger;
                // Club field was visible — standalone add admin, just go back.
                navigation.goBack();
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Registration Failed', res.message || getSafeErrorMessage(res) || 'Registration failed. Please try again.');
    }
  } catch (e) {
    const apiMessage = e?.response?.data?.message;
    const status = e?.response?.status;
    const fallbackMsg = e?.response?.data?.title || e?.message || 'Network error';

    Alert.alert(
      apiMessage ? 'Registration Failed' : `Error${status ? ` (${status})` : ''}`,
      apiMessage || fallbackMsg
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide} disabled={loading}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Create Account</Text>
        <TouchableOpacity onPress={handleSignup} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.navSave}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <Field label="Full Name" required error={errors.fullName}>
            <StyledInput
              value={formData.fullName}
              onChangeText={(t) => updateField('fullName', t)}
              hasError={!!errors.fullName}
              returnKeyType="next"
            />
          </Field>

          <Field label="Email" required error={errors.email}>
            <StyledInput
              value={formData.email}
              onChangeText={(t) => updateField('email', t)}
              hasError={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </Field>

          <PasswordField
            label="Password"
            required
            value={formData.password}
            onChangeText={(t) => updateField('password', t)}
            error={errors.password}
            hint="Min 6 chars, include number & special character"
            visible={showPassword}
            onToggleVisible={() => setShowPassword(!showPassword)}
          />

          <PasswordField
            label="Confirm Password"
            required
            value={formData.confirmPassword}
            onChangeText={(t) => updateField('confirmPassword', t)}
            error={errors.confirmPassword}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <Field label="Contact Number" required error={errors.contactNumber}>
            <StyledInput
              value={formData.contactNumber}
              onChangeText={(t) => updateField('contactNumber', t)}
              hasError={!!errors.contactNumber}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </Field>

          <Field label="Address" required error={errors.address}>
            <StyledInput
              value={formData.address}
              onChangeText={(t) => updateField('address', t)}
              hasError={!!errors.address}
              multiline
            />
          </Field>

          {/* ── Country ── */}
          <SelectField
            label="Country"
            required
            value={selectedCountry?.countryName || ''}
            placeholder="Select country…"
            onPress={() => setCountryModal(true)}
            error={errors.country}
          />

          {/* ── State ── */}
          <SelectField
            label="State"
            required
            value={selectedState?.stateName || ''}
            placeholder="Select state…"
            onPress={() => setStateModal(true)}
            error={errors.state}
            disabled={!selectedCountry}
            loading={statesLoading}
          />

          {/* ── Club (SINGLE SELECT — an admin manages one club) ── */}
          {!hideClubSelection && (
            <SelectField
              label="Club"
              required
              value={selectedClub?.clubName || ''}
              placeholder="Select club…"
              onPress={() =>
                selectedState
                  ? setClubModal(true)
                  : Alert.alert('Select state first')
              }
              error={errors.club}
              loading={clubsLoading}
            />
          )}

          {/* ── Gender ── */}
          <View style={styles.field.wrapper}>
            <Text style={styles.field.label}>Gender<Text style={styles.field.req}> *</Text></Text>
            <View style={{ width: '100%' }} onLayout={(e) => setMenuWidth(e.nativeEvent.layout.width)}>
              <Menu visible={genderMenuVisible} onDismiss={() => setGenderMenuVisible(false)}
                contentStyle={{ width: menuWidth }}
                anchor={
                  <TouchableOpacity onPress={() => setGenderMenuVisible(true)}>
                    <View pointerEvents="none">
                      <StyledInput value={formData.gender} editable={false} hasError={!!errors.gender} />
                    </View>
                  </TouchableOpacity>
                }>
                <Menu.Item title="Male" onPress={() => { updateField('gender', 'Male'); setGenderMenuVisible(false); }} />
                <Menu.Item title="Female" onPress={() => { updateField('gender', 'Female'); setGenderMenuVisible(false); }} />
                <Menu.Item title="Transgender" onPress={() => { updateField('gender', 'Transgender'); setGenderMenuVisible(false); }} />
              </Menu>
            </View>
            {!!errors.gender && <Text style={styles.field.error}>{errors.gender}</Text>}
          </View>

          {/* ── Date of Birth ── */}
          <Field label="Date of Birth" required error={errors.dateOfBirth}>
            <View style={{ position: 'relative' }}>
              <StyledInput
                value={formData.dateOfBirth}
                onChangeText={handleDOBTextChange}
                placeholder="YYYY-MM-DD"
                keyboardType="number-pad"
                hasError={!!errors.dateOfBirth}
                style={{ paddingRight: 44 }}
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="calendar-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </Field>
          {showDatePicker && (
            <DateTimePicker value={selectedDate || new Date()} mode="date" display="default"
              minimumDate={minDate} maximumDate={today}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (event.type === 'set' && date) {
                  setSelectedDate(date);
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: formatDate(date),
                    age: calculateAge(date),
                  }));
                }
              }} />
          )}

          <Field label="Age" required error={errors.age}>
            <StyledInput value={formData.age} editable={false} hasError={!!errors.age} keyboardType="numeric" />
          </Field>

          {/* ── Occupation ── */}
          <View style={styles.field.wrapper}>
            <Text style={styles.field.label}>Occupation<Text style={styles.field.req}> *</Text></Text>
            <View style={{ width: '100%' }} onLayout={(e) => setOccupationMenuWidth(e.nativeEvent.layout.width)}>
              <Menu visible={occupationMenuVisible} onDismiss={() => setOccupationMenuVisible(false)}
                contentStyle={{ width: occupationMenuWidth }}
                anchor={
                  <TouchableOpacity onPress={() => setOccupationMenuVisible(true)}>
                    <View pointerEvents="none">
                      <StyledInput value={occupation} editable={false} hasError={!!errors.occupation} />
                    </View>
                  </TouchableOpacity>
                }>
                {OCCUPATION_OPTIONS.map((opt) => (
                  <Menu.Item key={opt} title={opt} onPress={() => handleOccupationSelect(opt)} />
                ))}
              </Menu>
            </View>
            {!!errors.occupation && <Text style={styles.field.error}>{errors.occupation}</Text>}
          </View>

          {/* ── Occupation Details (Employed / Self Employed only) ── */}
          {showOccupationDetails && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Occupation Details</Text>
              <Field label="Occupation Details" required error={errors.occupationDetails}>
                <StyledInput
                  value={occupationDetails}
                  onChangeText={setOccupationDetails}
                  hasError={!!errors.occupationDetails}
                  
                />
              </Field>
            </View>
          )}

          {/* ── Educational Qualification (shown for any occupation once selected) ── */}
          {showEducationSection && (
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>Educational Qualification</Text>
              <Field label="Educational Qualification" required error={errors.qualification}>
                <StyledInput
                  value={qualification}
                  onChangeText={setQualification}
                  hasError={!!errors.qualification}
                  placeholder="e.g., Diploma-Civil Engineering"
                />
              </Field>
            </View>
          )}

          {/* Profile Photo */}
          <Text style={styles.photoLabel}>Profile Photo (Optional)</Text>
          <TouchableOpacity style={styles.photoPickerRow} onPress={pickProfilePhoto}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>👤</Text>
              </View>
            )}
            <View style={styles.photoPickerText}>
              <Text style={styles.photoPickerTitle}>
                {profilePhoto ? 'Photo selected' : 'Upload profile photo'}
              </Text>
              <Text style={styles.photoPickerHint}>Tap to choose from gallery</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* ── Country Modal ── */}
        <Modal visible={countryModal} transparent animationType="slide" onRequestClose={() => setCountryModal(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <FlatList
                data={countries}
                keyExtractor={(item) => String(item.countryId)}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedCountry(item);
                      setCountryModal(false);
                      loadStates(item.countryId);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.countryName}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.pickerEmpty}>No countries found</Text>}
              />
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setCountryModal(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── State Modal ── */}
        <Modal visible={stateModal} transparent animationType="slide" onRequestClose={() => setStateModal(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select State</Text>
              <FlatList
                data={states}
                keyExtractor={(item) => String(item.stateId)}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedState(item);
                      setStateModal(false);
                      loadClubsByState(item.stateId);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.stateName}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.pickerEmpty}>No states found</Text>}
              />
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setStateModal(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ── Club Modal (SINGLE SELECT) ── */}
        <Modal visible={clubModal} transparent animationType="slide" onRequestClose={() => setClubModal(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select Club</Text>
              <FlatList
                data={clubs}
                keyExtractor={(item) => String(item.clubId)}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => {
                  const checked = selectedClub?.clubId === item.clubId;
                  return (
                    <TouchableOpacity
                      style={[styles.pickerItem, styles.pickerItemRow, checked && styles.pickerItemActive]}
                      onPress={() => selectClub(item)}
                    >
                      <Text style={[styles.pickerItemText, checked && styles.pickerItemTextActive]}>
                        {item.clubName}
                      </Text>
                      <Text style={[styles.checkMark, checked && styles.checkMarkActive]}>
                        {checked ? '✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={styles.pickerEmpty}>No clubs in this state</Text>}
              />
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setClubModal(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};


export default AdminSignupScreen;