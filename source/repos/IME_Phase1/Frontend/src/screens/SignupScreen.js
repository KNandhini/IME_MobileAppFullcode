import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Menu } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../utils/api';
import { clubService } from '../services/clubService';
// Registration shares the nested field/input/picker style contract used by
// AddAdminScreen (for example styles.field.wrapper and styles.styledInput.base).
import { AddAdminScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { COLORS } from './theme'; // ← adjust this path to wherever COLORS actually lives
import DOBField from '../components/DOBField';

// Local color constants — same design system as AdminSignupScreen.
const NAVY = COLORS.primary;
const GOLD = COLORS.gold;
// Author Name: letters, numbers, spaces, dot, comma, hyphen
const AUTHOR_REGEX = /^[A-Za-z0-9\s.,-]*$/;

// ── Field wrapper — same shape as AdminSignupScreen's Field (own copy) ──
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

// ── Styled TextInput — same shape as AdminSignupScreen's StyledInput (own copy) ──
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
          <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.placeholder} />
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

const SignupScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    contactNumber: '', address: '', gender: '', age: '',
    dateOfBirth: '', place: '', designationId: 1,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  const [currentFee, setCurrentFee] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [clubModal, setClubModal] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);

  const [statesLoading, setStatesLoading] = useState(false);
  const [clubsLoading, setClubsLoading] = useState(false);

  // Refs used to auto-select India as the default country and to auto-scroll
  // the State list down to Tamil Nadu when it opens (most users on this app
  // are older Tamil Nadu municipal engineers, so this saves them scrolling).
  const stateListRef = useRef(null);
  const autoSelectedCountryRef = useRef(false);

  const OCCUPATION_OPTIONS = ['Employed', 'Self Employed', 'Unemployed'];
  const [occupation, setOccupation] = useState('');
  const [occupationMenuVisible, setOccupationMenuVisible] = useState(false);
  const [occupationMenuWidth, setOccupationMenuWidth] = useState(0);

  const [occupationDetails, setOccupationDetails] = useState('');
  const [qualification, setQualification] = useState('');

  const showOccupationDetails = occupation === 'Employed' || occupation === 'Self Employed';
  const showEducationSection = occupation === 'Employed' || occupation === 'Self Employed' || occupation === 'Unemployed';

  useEffect(() => {
    fetchFee();
    loadCountries();
  }, []);

  // Auto-select "India" as soon as the country list loads, so the Country
  // field is already filled in for the user without needing to open the modal.
  useEffect(() => {
    if (!autoSelectedCountryRef.current && countries.length > 0) {
      const india = countries.find(
        (c) => c.countryName?.trim().toLowerCase() === 'india'
      );
      if (india) {
        autoSelectedCountryRef.current = true;
        setSelectedCountry(india);
        loadStates(india.countryId);
      }
    }
  }, [countries]);

  // When the State picker opens, auto-scroll the list down to "Tamil Nadu"
  // so elderly users can see and tap it right away instead of scrolling
  // through the whole alphabetical list.
  useEffect(() => {
    if (stateModal && states.length > 0 && stateListRef.current) {
      const tnIndex = states.findIndex(
        (s) => s.stateName?.trim().toLowerCase() === 'tamil nadu'
      );
      if (tnIndex >= 0) {
        setTimeout(() => {
          stateListRef.current?.scrollToIndex({
            index: tnIndex,
            animated: true,
            viewPosition: 0.3,
          });
        }, 150);
      }
    }
  }, [stateModal, states]);

  const fetchFee = async () => {
    try {
      const res = await api.get('/payment/latest-fee');
      if (res.data.success) setCurrentFee(res.data.data);
    } catch (e) {
      console.warn('Fee fetch failed:', e.message);
    }
  };
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
        const filtered = res.data.filter(c => c.stateId === stateId);
        setClubs(filtered);
      }
    } catch (e) {
      console.warn('Clubs fetch failed:', e.message);
    } finally {
      setClubsLoading(false);
    }
  };

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
    if (field === 'fullName') v = value.replace(/[^A-Za-z\s]/g, '').slice(0, 150); if (field === 'fullName') {
      v = value
        .split('')
        .filter(ch => AUTHOR_REGEX.test(ch))
        .join('')
        .slice(0, 150);
    }
    else if (field === 'email') v = value.slice(0, 100);
    else if (field === 'contactNumber') {
      v = value;

      if (v.length === 1 && (v === '0' || v === '1')) {
        return;
      }

      v = v.slice(0, 10);
    }
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

  const validate = () => {
    let e = {};
    if (!formData.fullName) e.fullName = 'Name is required';
    if (!formData.email) e.email = 'Email is required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.password) e.password = 'Password is required';
    else if (!/^(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(formData.password)) e.password = 'Min 6 chars, 1 number & 1 special char';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!formData.contactNumber.trim()) {
      e.contactNumber = 'Contact number is required';
    } else if (!/^[2-9][0-9]{9}$/.test(formData.contactNumber)) {
      e.contactNumber =
        'Please enter a valid 10-digit mobile number. It cannot start with 0 or 1.';
    }
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
    if (!selectedClub) e.club = 'Please select a club';
    if (!occupation) e.occupation = 'Occupation is required';

    if (showOccupationDetails) {
      if (!occupationDetails) e.occupationDetails = 'Occupation details are required';
    }

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

  const buildSignupPayload = () => ({
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
    clubId: selectedClub?.clubId?.toString() ?? null,
    roleId: 2,
    occupation,
    ...(showOccupationDetails && { occupationDetails }),
    ...(showEducationSection && { qualification }),
  });

  const submitRegistration = async () => {
    setLoading(true);
    try {
      const response = await api.post('/Auth/signup', buildSignupPayload());
      const res = response.data;

      if (res.success) {
        const paymentParams = {
          userId: res.data.userId,
          memberId: res.data.memberId,
          feeAmount: currentFee ? parseFloat(currentFee.amount) : (route?.params?.feeAmount ?? 0),
          memberName: formData.fullName,
          memberEmail: formData.email,
          memberPassword: formData.password,
          profilePhotoUri: profilePhoto?.uri ?? null,
        };

        await AsyncStorage.setItem('paymentGrace', JSON.stringify({
          pending: true,
          registeredAt: Date.now(),
          memberId: res.data.memberId,
          paymentParams,
        }));

        Alert.alert(
          'Registration Successful! 🎉',
          'Do you want to complete your payment now?\n\nYou can also pay within 3 days to keep your account active.',
          [
            {
              text: 'Pay Now',
              onPress: () => navigation.navigate('RegistrationPayment', paymentParams),
            },
            {
              text: 'Pay Later (3 Days)',
              style: 'cancel',
              onPress: () => navigation.navigate('Login'),
            },
          ],
        );
      } else {
        Alert.alert('Registration Failed', getSafeErrorMessage(res));
      }
    } catch (e) {
      console.log("FULL ERROR");
      console.log(e);

      console.log("Response");
      console.log(e.response);

      console.log("Response Data");
      console.log(e.response?.data);

      Alert.alert("Error", getSafeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;
    if (!route?.params?.termsAccepted) {
      Alert.alert(
        'Terms Required',
        'Please review and accept the terms & conditions on the Membership Benefits page before registering.',
      );
      return;
    }
    await submitRegistration();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* ── Header ── */}
      <LinearGradient
        colors={[COLORS.headerStart, COLORS.headerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}>
        {navigation?.canGoBack?.() && (
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Create Account</Text>
        <Text style={styles.headerSubtitle}>Join IME to access member benefits</Text>
      </LinearGradient>

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
              onChangeText={(text) => {
                const numbers = text.replace(/[^0-9]/g, '');
                updateField('contactNumber', numbers);
              }}
              keyboardType="phone-pad"
              inputMode="numeric"
              maxLength={10}
              autoCorrect={false}
              autoCapitalize="none"
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
            onPress={() => selectedCountry ? setStateModal(true) : Alert.alert('Select country first')}
            error={errors.state}
            disabled={!selectedCountry}
            loading={statesLoading}
          />

          {/* ── Club ── */}
          <SelectField
            label="Club"
            required
            value={selectedClub?.clubName || ''}
            placeholder="Select club…"
            onPress={() => selectedState ? setClubModal(true) : Alert.alert('Select state first')}
            error={errors.club}
            disabled={!selectedState}
            loading={clubsLoading}
          />

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
          <DOBField
            label="Date of Birth"
            required
            value={selectedDate}
            minDate={minDate}
            maxDate={today}
            error={errors.dateOfBirth}
            FieldComponent={Field}
            InputComponent={StyledInput}
            onChange={(date) => {
              setSelectedDate(date);
              setFormData((prev) => ({
                ...prev,
                dateOfBirth: formatDate(date),
                age: calculateAge(date),
              }));
              setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
            }}
          />

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

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.accent} />
            ) : (
              <Text style={{ color: COLORS.white, textAlign: 'center', fontWeight: '700', fontSize: 15 }}>Register</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={{ color: COLORS.secondary, textAlign: 'center', fontWeight: '600', fontSize: 14 }}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>

        {/* ── Country Modal ── */}
        <Modal visible={countryModal} transparent animationType="slide" onRequestClose={() => setCountryModal(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <FlatList
                data={countries}
                keyExtractor={item => String(item.countryId)}
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
                ref={stateListRef}
                data={states}
                keyExtractor={item => String(item.stateId)}
                style={{ maxHeight: 380 }}
                getItemLayout={(data, index) => ({ length: 48, offset: 48 * index, index })}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    stateListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                      viewPosition: 0.3,
                    });
                  }, 200);
                }}
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

        {/* ── Club Modal ── */}
        <Modal visible={clubModal} transparent animationType="slide" onRequestClose={() => setClubModal(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>Select Club</Text>
              <FlatList
                data={clubs}
                keyExtractor={item => String(item.clubId)}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selectedClub?.clubId === item.clubId && styles.pickerItemActive]}
                    onPress={() => {
                      setSelectedClub(item);
                      setClubModal(false);
                      setErrors(prev => ({
                        ...prev,
                        club: undefined,
                      }));
                    }}
                  >
                    <Text style={[styles.pickerItemText, selectedClub?.clubId === item.clubId && styles.pickerItemTextActive]}>
                      {item.clubName}
                    </Text>
                  </TouchableOpacity>
                )}
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

export default SignupScreen;