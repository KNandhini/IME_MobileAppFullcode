import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal, Image, FlatList } from 'react-native';
import { TextInput, Button, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { clubService } from '../services/clubService';
import { AddAdminScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

// ─────────────────────────────────────────────────────────────────────────
// AdminSignupScreen
// Same form shape as SignupScreen, but:
//   • No "welcome / grace-period / fee" modal
//   • No RegistrationPayment navigation
//   • Sends roleId = 1 (Admin) instead of the default member roleId
//   • Lets you pick MULTIPLE clubs (an admin can manage more than one club)
//     and sends them as a single comma-separated string in `clubId`
//     (e.g. "3,7,12")
//   • Uploads the picked profile photo directly to /File/upload-profile-photo
//     right after signup succeeds, using the new memberId
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
  const [states, setStates]       = useState([]);
  const [clubs, setClubs]         = useState([]);

  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal]     = useState(false);
  const [clubModal, setClubModal]       = useState(false);

  const [selectedCountry, setSelectedCountry] = useState(null); // { countryId, countryName }
  const [selectedState, setSelectedState]     = useState(null); // { stateId, stateName }
  const [selectedClubs, setSelectedClubs]     = useState([]);   // [{ clubId, clubName }, ...] — MULTIPLE

  const [statesLoading, setStatesLoading] = useState(false);
  const [clubsLoading, setClubsLoading]   = useState(false);
useEffect(() => {
  if (hideClubSelection && presetClub) {
    setSelectedClubs([
      {
        clubId: presetClub.clubId,
        clubName: presetClub.clubName,
      },
    ]);
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
    setSelectedClubs([]);
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
    setSelectedClubs([]);
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

  const toggleClubSelection = (club) => {
    setSelectedClubs((prev) => {
      const exists = prev.find((c) => c.clubId === club.clubId);
      if (exists) return prev.filter((c) => c.clubId !== club.clubId);
      return [...prev, club];
    });
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
    if (!formData.dateOfBirth) e.dateOfBirth = 'Required';
    if (!selectedCountry) e.country = 'Required';
    if (!selectedState) e.state = 'Required';
    if (!hideClubSelection && selectedClubs.length === 0) e.clubs = 'Select at least one club';
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
        stateId:       selectedState?.stateId ?? null,
        // Comma-separated list of every club this admin manages, e.g. "3,7,12"
        // (a single club still works fine, it'll just be one id with no comma)
        clubId:        selectedClubs.map((c) => c.clubId).join(',')??null,
        // 1 = Admin (see backend SignupRequestDTO.RoleId)
        roleId:        1,
      };

      const response = await api.post('/Auth/signup', payload);
      const res = response.data;

      if (res.success) {
        // No payment step to defer to here, so push the photo now.
        if (profilePhoto && res.data?.memberId) {
            debugger;
          const uploaded = await uploadProfilePhoto(res.data.memberId, profilePhoto.uri);
          if (!uploaded) {
            console.warn('Profile photo upload did not succeed for member', res.data.memberId);
          }
        }

        const clubNames = selectedClubs?.map(c => c.clubName).join(', ');

  const newMember = {
    memberId: res.data.memberId,
    fullName: formData.fullName,
  };

  Alert.alert(
    'Admin Created',
    clubNames
      ? `${formData.fullName} has been registered as an admin for ${clubNames}.`
      : `${formData.fullName} has been registered as an admin.`,
    [
      {
        text: 'OK',
        onPress: () => {
          navigation.navigate({
            name: 'ClubForm',
            params: {
              newAdminMember: newMember,
            },
            merge: true,
          });
        },
      },
    ]
  );
} else {
        Alert.alert('Registration Failed', getSafeErrorMessage(res));
      }
    } catch (e) {
      const status    = e?.response?.status;
      const serverMsg = e?.response?.data?.message || e?.response?.data?.title || e?.message || 'Network error';
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Admin</Text>
        <Text style={styles.subtitle}>Register a new club administrator</Text>
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
          onPress={() => (selectedCountry ? setStateModal(true) : Alert.alert('Select country first'))}
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

        {/* ── Clubs (MULTI-SELECT — an admin can manage more than one club) ── */}
        {!hideClubSelection && (
  <>
    <TouchableOpacity
      onPress={() =>
        selectedState
          ? setClubModal(true)
          : Alert.alert('Select state first')
      }
      activeOpacity={0.8}
    >
      <View pointerEvents="none">
        <TextInput
          label={clubsLoading ? 'Loading clubs…' : 'Clubs *'}
          value={selectedClubs.map(c => c.clubName).join(', ')}
          mode="outlined"
          theme={{ roundness: 10 }}
          outlineColor="#BBDEFB"
          activeOutlineColor="#1976D2"
          style={[
            styles.input,
            !selectedState && { opacity: 0.5 },
          ]}
          editable={false}
          multiline
        />
      </View>
    </TouchableOpacity>

    {errors.clubs && (
      <Text style={styles.error}>
        {errors.clubs}
      </Text>
    )}
  </>
)}

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
          Create Admin
        </Button>
      </View>

      <Button mode="text" onPress={() => navigation.goBack()} style={styles.linkButton}>
        Cancel
      </Button>

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

      {/* ── Club Modal (MULTI-SELECT) ── */}
      <Modal visible={clubModal} transparent animationType="slide" onRequestClose={() => setClubModal(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Clubs (you can pick more than one)</Text>
            <FlatList
              data={clubs}
              keyExtractor={(item) => String(item.clubId)}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => {
                const checked = selectedClubs.some((c) => c.clubId === item.clubId);
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, styles.pickerItemRow, checked && styles.pickerItemActive]}
                    onPress={() => toggleClubSelection(item)}
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
            <TouchableOpacity style={styles.pickerDone} onPress={() => setClubModal(false)}>
              <Text style={styles.pickerDoneText}>Done ({selectedClubs.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};



export default AdminSignupScreen;
