import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Modal, Image,FlatList
} from 'react-native';
import { TextInput, Button, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { clubService } from '../services/clubService';
//import { Modal, FlatList } from 'react-native'; // Modal already imported, just ensure FlatList is there
const SignupScreen = ({ navigation }) => {
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

  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [currentFee, setCurrentFee] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
// ── Location state ─────────────────────────────────────────────────────────
const [countries,       setCountries]       = useState([]);
const [states,          setStates]          = useState([]);
const [clubs,           setClubs]           = useState([]);

const [countryModal,    setCountryModal]    = useState(false);
const [stateModal,      setStateModal]      = useState(false);
const [clubModal,       setClubModal]       = useState(false);

const [selectedCountry, setSelectedCountry] = useState(null); // { countryId, countryName }
const [selectedState,   setSelectedState]   = useState(null); // { stateId, stateName }
const [selectedClub,    setSelectedClub]    = useState(null); // { clubId, clubName }

const [statesLoading,   setStatesLoading]   = useState(false);
const [clubsLoading,    setClubsLoading]    = useState(false);

  useEffect(() => {
    fetchFee();
     loadCountries(); // ✅ ADD THIS
  }, []);

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
  if (!selectedState)   e.state   = 'Required';       // ✅ NEW
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

const handleSignup = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    // ✅ Explicit payload — no spread, no extra fields
    const payload = {
      fullName:      formData.fullName,
      email:         formData.email,
      password:      formData.password,
      contactNumber: formData.contactNumber,
      address:       formData.address,
      gender:        formData.gender,
      age:           parseInt(formData.age),
      dateOfBirth:   formData.dateOfBirth,
      designationId: formData.designationId,
      countryId:     selectedCountry?.countryId ?? null,
      stateId:       selectedState?.stateId     ?? null,
      clubId:        selectedClub?.clubId        ?? null,
    };

    const response = await api.post('/Auth/signup', payload);
    const res = response.data;
    if (res.success) {
      const paymentParams = {
        userId:          res.data.userId,
        memberId:        res.data.memberId,
        feeAmount:       currentFee ? parseFloat(currentFee.amount) : 0,
        memberName:      formData.fullName,
        memberEmail:     formData.email,
        memberPassword:  formData.password,
        profilePhotoUri: profilePhoto?.uri ?? null,
      };
      Alert.alert(
        'Registration Successful! 🎉',
        'Do you want to complete your payment now?\n\nYou can also pay within 3 days to keep your account active.',
        [
          {
            text: 'Pay Now',
            onPress: () => navigation.navigate('RegistrationPayment', paymentParams),
          },
          {
            text: 'Pay Later (3 days)',
            style: 'cancel',
            onPress: () => {
              Alert.alert(
                'Account Activated',
                'Your account is active for 3 days. Please complete payment before it expires.',
                [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }],
              );
            },
          },
        ],
      );
    } else {
      Alert.alert('Failed', res.message);
    }
  } catch (e) {
    const status    = e?.response?.status;
    const serverMsg = e?.response?.data?.message || e?.response?.data?.title || e?.message || 'Network error';
    Alert.alert(`Error${status ? ` (${status})` : ''}`, serverMsg);
  } finally {
    setLoading(false);
  }
};
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Welcome Modal */}
      <Modal visible={welcomeVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Welcome to IME</Text>
            <Text style={styles.modalSubtitle}>Member Registration</Text>
            <Text style={styles.modalBody}>
              Complete the registration form to join the IMC community. You can pay the annual membership fee now or within 3 days of registration.
            </Text>
            {currentFee ? (
              <View style={styles.feeBox}>
                <Text style={styles.feeLabel}>Annual Membership Fee</Text>
                <Text style={styles.feeAmount}>₹{parseFloat(currentFee.amount).toFixed(2)}</Text>
                <Text style={styles.feeNote}>Complete payment within 3 days</Text>
              </View>
            ) : (
              <Text style={styles.noFee}>No fee currently set. Contact admin.</Text>
            )}
            <TouchableOpacity style={styles.proceedBtn} onPress={() => setWelcomeVisible(false)}>
              <Text style={styles.proceedBtnText}>Start Registration</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backLink}>Already a member? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join IME Membership</Text>
      </View>

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
                updateField('dateOfBirth', formatDate(date));
              }
            }} />
        )}

        <TextInput label="Age *" value={formData.age} onChangeText={(t) => updateField('age', t)}
          keyboardType="numeric" mode="outlined" theme={{ roundness: 10 }}
          outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.age && <Text style={styles.error}>{errors.age}</Text>}

       {/* <TextInput label="Place *" value={formData.place} onChangeText={(t) => updateField('place', t)}
          mode="outlined" theme={{ roundness: 10 }} outlineColor="#BBDEFB" activeOutlineColor="#1976D2" style={styles.input} />
        {errors.place && <Text style={styles.error}>{errors.place}</Text>}*/}

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

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  content:        { padding: 20 },
  header:         { alignItems: 'center', marginBottom: 25 },
  title:          { fontSize: 28, fontWeight: 'bold', color: '#1976D2' },
  subtitle:       { fontSize: 14, color: '#666', marginTop: 5 },
  input:          { marginBottom: 10, borderRadius: 10 },
  button:         { marginTop: 20, paddingVertical: 6, borderRadius: 10, backgroundColor: '#1E3A5F' },
  linkButton:     { marginTop: 10 },
  error:          { color: 'red', fontSize: 12, marginBottom: 8, marginLeft: 5 },
  helper:         { fontSize: 12, color: '#555', marginBottom: 8, marginLeft: 5 },
  // Profile Photo
  photoLabel:         { fontSize: 14, fontWeight: '600', color: '#1E3A5F', marginBottom: 8, marginTop: 4 },
  photoPickerRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BBDEFB', borderStyle: 'dashed' },
  photoPreview:       { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ddd' },
  photoPlaceholder:   { width: 60, height: 60, borderRadius: 30, backgroundColor: '#BBDEFB', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderIcon: { fontSize: 28 },
  photoPickerText:    { marginLeft: 14, flex: 1 },
  photoPickerTitle:   { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  photoPickerHint:    { fontSize: 12, color: '#888', marginTop: 2 },
  // Welcome Modal
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox:       { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', alignItems: 'center' },
  modalTitle:     { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F', marginBottom: 4 },
  modalSubtitle:  { fontSize: 14, color: '#666', marginBottom: 16 },
  modalBody:      { fontSize: 14, color: '#444', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  feeBox:         { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%', marginBottom: 20 },
  feeLabel:       { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  feeAmount:      { color: '#D4A017', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  feeNote:        { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  noFee:          { color: '#999', fontSize: 13, marginBottom: 20 },
  proceedBtn:     { backgroundColor: '#1E3A5F', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  proceedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink:       { color: '#1976D2', fontSize: 14 },
  // Picker modals
  pickerOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet:         { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  pickerTitle:         { fontSize: 17, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },
  pickerItem:          { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  pickerItemActive:    { backgroundColor: '#EBF0FA', paddingHorizontal: 8, borderRadius: 8 },
  pickerItemText:      { fontSize: 15, color: '#111' },
  pickerItemTextActive:{ color: '#1E3A5F', fontWeight: '700' },
  pickerEmpty:         { textAlign: 'center', color: '#888', paddingVertical: 24 },
  pickerCancel:        { marginTop: 12, backgroundColor: '#F0F2F5', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  pickerCancelText:    { fontSize: 15, color: '#1E3A5F', fontWeight: '600' },
});

export default SignupScreen;
