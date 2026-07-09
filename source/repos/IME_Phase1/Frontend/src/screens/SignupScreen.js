import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal, Image, FlatList } from 'react-native';
import { TextInput, Button, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { clubService } from '../services/clubService';
import { SignupScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [currentFee, setCurrentFee] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  // ── Location state ─────────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [clubModal, setClubModal] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null); // { countryId, countryName }
  const [selectedState, setSelectedState] = useState(null); // { stateId, stateName }
  const [selectedClub, setSelectedClub] = useState(null); // { clubId, clubName }

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
    fetchFee();
    loadCountries();
  }, []);

  // Fee is still needed here (feeAmount is included in the payment params sent
  // to RegistrationPayment) even though the fee is now *displayed* on the
  // Membership Benefits screen, not here.
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
    //else if (field === 'place') v = value.replace(/[^A-Za-z\s]/g, '').slice(0, 50);
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
    if (!formData.fullName) e.fullName = 'Required';
    if (!formData.email) e.email = 'Required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.password) e.password = 'Required';
    else if (!/^(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(formData.password)) e.password = 'Min 6 chars, 1 number & 1 special char';
    if (!formData.confirmPassword) e.confirmPassword = 'Required';
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!formData.contactNumber) e.contactNumber = 'Required';
    else if (!/^[0-9]{10}$/.test(formData.contactNumber)) e.contactNumber = 'Must be 10 digits';
    if (!formData.address) e.address = 'Required';
    if (!formData.gender) e.gender = 'Required';
    if (!formData.age) e.age = 'Required';
    //if (!formData.place) e.place = 'Required';
    if (!formData.dateOfBirth) e.dateOfBirth = 'Required';
    if (!selectedCountry) e.country = 'Required';       // ✅ NEW
    if (!selectedState) e.state = 'Required';       // ✅ NEW

    // ── Occupation ──
    if (!occupation) e.occupation = 'Required';

    if (showOccupationDetails) {
      if (!occupationDetails) e.occupationDetails = 'Required';
    }

    // ── Educational Qualification ──
    if (showEducationSection) {
      if (!qualification) e.qualification = 'Required';
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

  // Was previously gated behind the in-screen Terms modal's "Agree & Continue".
  // Terms are now accepted on the Membership Benefits screen before the user
  // ever reaches this form, so this fires directly off the Register button.
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
      const status = e?.response?.status;
      const serverMsg = e?.response?.data?.message || e?.response?.data?.title || e?.message || 'Network error';
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;
    // Guard against reaching this screen without going through the Membership
    // Benefits terms-acceptance step (e.g. deep link, back-navigation edge case).
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.card}>
        <TextInput label="Full Name *" value={formData.fullName} onChangeText={(t) => updateField('fullName', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

        <TextInput label="Email *" value={formData.email} onChangeText={(t) => updateField('email', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <TextInput label="Password *" value={formData.password} onChangeText={(t) => updateField('password', t)}
          secureTextEntry={!showPassword} mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
          right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
          style={styles.input} />
        <Text style={styles.helper}>Min 6 chars, include number & special character</Text>
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

        <TextInput label="Confirm Password *" value={formData.confirmPassword} onChangeText={(t) => updateField('confirmPassword', t)}
          secureTextEntry={!showConfirmPassword} mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
          right={<TextInput.Icon icon={showConfirmPassword ? 'eye-off' : 'eye'} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
          style={styles.input} />
        {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}

        <TextInput label="Contact Number *" value={formData.contactNumber} onChangeText={(t) => updateField('contactNumber', t)}
          keyboardType="numeric" mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.contactNumber && <Text style={styles.error}>{errors.contactNumber}</Text>}

        <TextInput label="Address *" value={formData.address} onChangeText={(t) => updateField('address', t)}
          multiline mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.address && <Text style={styles.error}>{errors.address}</Text>}
        {/* ── Address Line (kept) ── */}
        {/* ── Country ── */}
        <TouchableOpacity onPress={() => setCountryModal(true)}>
          <View pointerEvents="none">
            <TextInput
              label="Country *"
              value={selectedCountry?.countryName || ''}
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={styles.input}
              editable={false}
            />
          </View>
        </TouchableOpacity>
        {errors.country && <Text style={styles.error}>{errors.country}</Text>}

        {/* ── State ── */}
        <TouchableOpacity
          onPress={() => selectedCountry ? setStateModal(true) : Alert.alert('Select country first')}
          activeOpacity={0.8}
        >
          <View pointerEvents="none">
            <TextInput
              label={statesLoading ? 'Loading states…' : 'State *'}
              value={selectedState?.stateName || ''}
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={[styles.input, !selectedCountry && { opacity: 0.5 }]}
              editable={false}
            />
          </View>
        </TouchableOpacity>
        {errors.state && <Text style={styles.error}>{errors.state}</Text>}

        {/* ── Club (optional, filtered by state) ── */}
        <TouchableOpacity
          onPress={() => selectedState ? setClubModal(true) : Alert.alert('Select state first')}
          activeOpacity={0.8}
        >
          <View pointerEvents="none">
            <TextInput
              label={clubsLoading ? 'Loading clubs…' : 'Club *'}
              value={selectedClub?.clubName || ''}
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={[styles.input, !selectedState && { opacity: 0.5 }]}
              editable={false}
            />
          </View>
        </TouchableOpacity>
        <View style={{ width: '100%' }} onLayout={(e) => setMenuWidth(e.nativeEvent.layout.width)}>
          <Menu visible={genderMenuVisible} onDismiss={() => setGenderMenuVisible(false)}
            contentStyle={{ width: menuWidth }}
            anchor={
              <TouchableOpacity onPress={() => setGenderMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput label="Gender *" value={formData.gender} mode="outlined"
                    theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
                    style={styles.input} editable={false} />
                </View>
              </TouchableOpacity>
            }>
            <Menu.Item title="Male" onPress={() => { updateField('gender', 'Male'); setGenderMenuVisible(false); }} />
            <Menu.Item title="Female" onPress={() => { updateField('gender', 'Female'); setGenderMenuVisible(false); }} />
            <Menu.Item title="Transgender" onPress={() => { updateField('gender', 'Transgender'); setGenderMenuVisible(false); }} />
          </Menu>
        </View>
        {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput label="Date of Birth *" value={formData.dateOfBirth} mode="outlined"
              theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2"
              style={styles.input} editable={false} />
          </View>
        </TouchableOpacity>
        {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth}</Text>}
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

        <TextInput label="Age *" value={formData.age}
          keyboardType="numeric" mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} editable={false} />
        {errors.age && <Text style={styles.error}>{errors.age}</Text>}

        {/* <TextInput label="Place *" value={formData.place} onChangeText={(t) => updateField('place', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.place && <Text style={styles.error}>{errors.place}</Text>}*/}

        {/* ── Occupation ── */}
        <View style={{ width: '100%' }} onLayout={(e) => setOccupationMenuWidth(e.nativeEvent.layout.width)}>
          <Menu visible={occupationMenuVisible} onDismiss={() => setOccupationMenuVisible(false)}
            contentStyle={{ width: occupationMenuWidth }}
            anchor={
              <TouchableOpacity onPress={() => setOccupationMenuVisible(true)}>
                <View pointerEvents="none">
                  <TextInput label="Occupation *" value={occupation} mode="outlined"
                    theme={{ roundness: 10 }}
                    outlineColor={occupationMenuVisible ? '#1976D2' : '#BBDEFB'}
                    activeOutlineColor="#1976D2"
                    style={styles.input} editable={false} />
                </View>
              </TouchableOpacity>
            }>
            {OCCUPATION_OPTIONS.map((opt) => (
              <Menu.Item key={opt} title={opt} onPress={() => handleOccupationSelect(opt)} />
            ))}
          </Menu>
        </View>
        {errors.occupation && <Text style={styles.error}>{errors.occupation}</Text>}

        {/* ── Occupation Details (Employed / Self Employed only) ── */}
        {showOccupationDetails && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Occupation Details</Text>
            <TextInput
              label="Occupation Details *"
              value={occupationDetails}
              onChangeText={setOccupationDetails}
              multiline mode="outlined" theme={{ roundness: 10 }}
              outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
            {errors.occupationDetails && <Text style={styles.error}>{errors.occupationDetails}</Text>}
          </View>
        )}

        {/* ── Educational Qualification (shown for any occupation once selected) ── */}
        {showEducationSection && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Educational Qualification</Text>
            <TextInput
              label="Educational Qualification *"
              value={qualification}
              placeholder="e.g., Diploma-Civil Engineering"
              onChangeText={setQualification}
              mode="outlined" theme={{ roundness: 10 }}
              outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
            {errors.qualification && <Text style={styles.error}>{errors.qualification}</Text>}
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

        <Button mode="contained" onPress={handleSignup} loading={loading} style={styles.button} labelStyle={{ fontSize: 16 }}>
          Register
        </Button>
      </View>

      <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
        Already have an account? Login
      </Button>
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
              data={states}
              keyExtractor={item => String(item.stateId)}
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
  );
};

export default SignupScreen;