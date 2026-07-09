import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Modal, FlatList, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import { clubService } from '../services/clubService';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';
import { ProfileEditScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const OCCUPATION_OPTIONS = ['Employed', 'Self Employed', 'Unemployed'];

const ProfileEditScreen = ({ navigation }) => {
  const [profilePhoto, setProfilePhoto] = useState(null);

  // ── Loading / saving ──────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [clubId, setClubId] = useState(null); // ✅ added

  // ── Form data ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    address: '',
    gender: '',
    age: '',
    dateOfBirth: '',
    designationId: 1,
  });

  const [errors, setErrors] = useState({});

  // ── Gender menu ───────────────────────────────────────────────────────────
  const [genderMenuVisible, setGenderMenuVisible] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);

  // ── Date picker ───────────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Location state ────────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [statesLoading, setStatesLoading] = useState(false);

  // ── Occupation / Education state (NEW) ────────────────────────────────────
  const [occupation, setOccupation] = useState('');
  const [occupationMenuVisible, setOccupationMenuVisible] = useState(false);
  const [occupationMenuWidth, setOccupationMenuWidth] = useState(0);
  const [occupationDetails, setOccupationDetails] = useState('');
  const [qualification, setQualification] = useState('');

  const showOccupationDetails = occupation === 'Employed' || occupation === 'Self Employed';
  const showEducationSection = occupation === 'Employed' || occupation === 'Self Employed' || occupation === 'Unemployed';

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    loadProfile();
    loadCountries();
  }, []);

  const loadProfile = async () => {
    setPageLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const id = user.memberId;
      setMemberId(id);

      const res = await memberService.getProfile(id);

      if (res.success && res.data) {
        const d = res.data;

        // ✅ Store clubId from profile
        const cid = d.clubId ?? d.ClubId ?? null;
        setClubId(cid);

        setFormData({
          fullName: d.fullName || '',
          email: d.email || '',
          contactNumber: d.contactNumber || '',
          address: d.address || '',
          gender: d.gender || '',
          age: d.dateOfBirth ? calculateAge(new Date(d.dateOfBirth)) : (d.age != null ? String(d.age) : ''),
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
          designationId: d.designationId || 1,
        });

        // ── Occupation / Education (NEW) ──
        setOccupation(d.occupation || '');
        setOccupationDetails(d.occupationDetails || '');
        setQualification(d.qualification || '');

        if (d.profilePhoto) {
          setProfilePhoto(`data:image/jpeg;base64,${d.profilePhoto}`);
        }
        if (d.countryId) {
          setSelectedCountry({ countryId: d.countryId, countryName: d.countryName || '' });
          loadStates(d.countryId, d.stateId, d.stateName);
        }
        if (d.dateOfBirth) setSelectedDate(new Date(d.dateOfBirth));
      }
    } catch (e) {
      console.error('Load profile error:', e);
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setPageLoading(false);
    }
  };

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow gallery access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  /* const uploadProfilePhoto = async (photoUri) => {
     try {
       debugger;
       // ✅ Skip if still the server-loaded base64 (not a newly picked file)
       if (photoUri.startsWith('data:')) {
         console.log('Photo unchanged, skipping upload.');
         return true;
       }
 
       const formData = new FormData();
       formData.append('file', {
         uri:  photoUri,
         name: 'profile_photo.jpg',
         type: 'image/jpeg',
       });
       formData.append('memberId', memberId.toString());
 
       const baseUrl  = api.defaults.baseURL;
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
   };*/
  const uploadProfilePhoto = async (photoUri) => {
    try {
      // Skip if still the server-loaded base64 (not a newly picked file)
      if (photoUri.startsWith('data:')) {
        console.log('Photo unchanged, skipping upload.');
        return true;
      }

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

      // ── Show API error message if upload failed ──
      if (!json.success) {
        Alert.alert('Photo Upload Failed', getSafeErrorMessage(json));
        return false;
      }

      return true;
    } catch (e) {
      console.warn('Profile photo upload failed:', e.message);
      Alert.alert('Upload Error', 'Failed to upload profile photo. Please try again.');
      return false;
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

  const loadStates = async (countryId, preSelectStateId = null, preSelectStateName = '') => {
    setStatesLoading(true);
    try {
      const res = await clubService.getStatesByCountry(countryId);
      if (res.success) {
        const list = res.data || [];
        setStates(list);
        if (preSelectStateId) {
          const found = list.find(s => s.stateId === preSelectStateId);
          setSelectedState(found || { stateId: preSelectStateId, stateName: preSelectStateName });
        }
      }
    } catch (e) {
      console.warn('States fetch failed:', e.message);
    } finally {
      setStatesLoading(false);
    }
  };

  // ── Field updater ─────────────────────────────────────────────────────────
  const updateField = (field, value) => {
    let v = value;
    if (field === 'fullName') v = value.replace(/[^A-Za-z\s]/g, '').slice(0, 150);
    else if (field === 'email') v = value.slice(0, 100);
    else if (field === 'contactNumber') v = value.replace(/[^0-9]/g, '').slice(0, 10);
    else if (field === 'age') v = value.replace(/[^0-9]/g, '').slice(0, 3);
    else if (field === 'address') v = value.replace(/[^A-Za-z0-9\s,./-]/g, '').slice(0, 250);
    setFormData(prev => ({ ...prev, [field]: v }));
  };

  // ── Occupation select (NEW) ───────────────────────────────────────────────
  const handleOccupationSelect = (value) => {
    setOccupation(value);
    setOccupationMenuVisible(false);
    if (value !== 'Employed' && value !== 'Self Employed') {
      setOccupationDetails('');
    }
    setErrors(prev => ({ ...prev, occupation: undefined, occupationDetails: undefined, qualification: undefined }));
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

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    let e = {};
    if (!formData.fullName) e.fullName = 'Required';
    if (!formData.email) e.email = 'Required';
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(formData.email))
      e.email = 'Invalid email';
    if (!formData.contactNumber) e.contactNumber = 'Required';
    else if (!/^[0-9]{10}$/.test(formData.contactNumber))
      e.contactNumber = 'Must be 10 digits';
    if (!formData.address) e.address = 'Required';
    if (!formData.gender) e.gender = 'Required';
    if (!formData.age) e.age = 'Required';
    if (!formData.dateOfBirth) e.dateOfBirth = 'Required';
    if (!selectedCountry) e.country = 'Required';
    if (!selectedState) e.state = 'Required';

    // ── Occupation / Education (NEW) ──
    if (!occupation) e.occupation = 'Required';
    if (showOccupationDetails && !occupationDetails) e.occupationDetails = 'Required';
    if (showEducationSection && !qualification) e.qualification = 'Required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  /* const handleSave = async () => {
     if (!validate()) return;
     setSaving(true);
     try {
       const payload = {
         memberId:      memberId,                          // ✅ added
         fullName:      formData.fullName,
         email:         formData.email,
         contactNumber: formData.contactNumber,
         address:       formData.address,
         gender:        formData.gender,
         age:           parseInt(formData.age),
         dateOfBirth:   formData.dateOfBirth,
         designationId: formData.designationId,
         countryId:     selectedCountry?.countryId ?? null,
         stateId:       selectedState?.stateId     ?? null,
         clubId:        clubId,                            // ✅ added
       };
 
       console.log('Update payload:', JSON.stringify(payload)); // ✅ helpful for debugging
 
       const res = await memberService.updateProfile(memberId, payload);
 
       if (res.success) {
         // Upload image AFTER profile update
         if (profilePhoto) {
           await uploadProfilePhoto(profilePhoto);
         }
         Alert.alert('Success', 'Profile updated successfully!', [
           { text: 'OK', onPress: () => navigation.goBack() },
         ]);
       } else {
         Alert.alert('Failed', getSafeErrorMessage(res));
       }
     } catch (e) {
       Alert.alert('Error', getSafeErrorMessage(e));
     } finally {
       setSaving(false);
     }
   };
 */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        memberId: memberId,
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        address: formData.address,
        gender: formData.gender,
        age: parseInt(formData.age),
        dateOfBirth: formData.dateOfBirth,
        designationId: formData.designationId,
        countryId: selectedCountry?.countryId ?? null,
        stateId: selectedState?.stateId ?? null,
        clubId: clubId,

        // ── Occupation / Education (NEW) ──
        occupation,
        occupationDetails: showOccupationDetails ? occupationDetails : null,
        qualification,
      };

      const res = await memberService.updateProfile(memberId, payload);

      if (res.success) {
        // Upload photo and check result
        if (profilePhoto) {
          const photoUploaded = await uploadProfilePhoto(profilePhoto);
          if (!photoUploaded) {
            // Profile saved but photo failed — stay on screen
            // Alert already shown inside uploadProfilePhoto
            return;
          }
        }
        // Both profile + photo saved successfully
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Failed', getSafeErrorMessage(res));
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  // ── Loading screen ────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#1E3A5F' }}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* Top navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide} disabled={saving}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#D4A017" />
            : <Text style={styles.navSave}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>

          {/* ── Profile Image ── */}
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={pickProfilePhoto}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Personal Information ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <TextInput
              label="Full Name *"
              value={formData.fullName}
              onChangeText={t => updateField('fullName', t)}
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={styles.input}
            />
            {errors.fullName && <Text style={styles.error}>{errors.fullName}</Text>}

            <TextInput
              label="Email *"
              value={formData.email}
              onChangeText={t => updateField('email', t)}
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}

            <TextInput
              label="Contact Number *"
              value={formData.contactNumber}
              onChangeText={t => updateField('contactNumber', t)}
              keyboardType="numeric"
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={styles.input}
            />
            {errors.contactNumber && <Text style={styles.error}>{errors.contactNumber}</Text>}

            <TextInput
              label="Address *"
              value={formData.address}
              onChangeText={t => updateField('address', t)}
              multiline
              numberOfLines={3}
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={styles.input}
            />
            {errors.address && <Text style={styles.error}>{errors.address}</Text>}
          </View>

          {/* ── Location ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Location</Text>

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
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </TouchableOpacity>
            {errors.country && <Text style={styles.error}>{errors.country}</Text>}

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
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </View>
            </TouchableOpacity>
            {errors.state && <Text style={styles.error}>{errors.state}</Text>}
          </View>

          {/* ── Other Details ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Other Details</Text>

            {/* Gender */}
            <View
              style={{ width: '100%' }}
              onLayout={e => setMenuWidth(e.nativeEvent.layout.width)}
            >
              <Menu
                visible={genderMenuVisible}
                onDismiss={() => setGenderMenuVisible(false)}
                contentStyle={{ width: menuWidth }}
                anchor={
                  <TouchableOpacity onPress={() => setGenderMenuVisible(true)}>
                    <View pointerEvents="none">
                      <TextInput
                        label="Gender *"
                        value={formData.gender}
                        mode="outlined"
                        theme={{ roundness: 10 }}
                        outlineColor="#BBDEFB"
                        activeOutlineColor="#1976D2"
                        style={styles.input}
                        editable={false}
                        right={<TextInput.Icon icon="chevron-down" />}
                      />
                    </View>
                  </TouchableOpacity>
                }
              >
                <Menu.Item title="Male" onPress={() => { updateField('gender', 'Male'); setGenderMenuVisible(false); }} />
                <Menu.Item title="Female" onPress={() => { updateField('gender', 'Female'); setGenderMenuVisible(false); }} />
                <Menu.Item title="Transgender" onPress={() => { updateField('gender', 'Transgender'); setGenderMenuVisible(false); }} />
              </Menu>
            </View>
            {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

            {/* Date of Birth */}
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <TextInput
                  label="Date of Birth *"
                  value={formData.dateOfBirth}
                  mode="outlined"
                  theme={{ roundness: 10 }}
                  outlineColor="#BBDEFB"
                  activeOutlineColor="#1976D2"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="calendar" />}
                />
              </View>
            </TouchableOpacity>
            {errors.dateOfBirth && <Text style={styles.error}>{errors.dateOfBirth}</Text>}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display="default"
                minimumDate={minDate}
                maximumDate={today}
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
                }}
              />
            )}

            {/* Age */}
            <TextInput
              label="Age *"
              value={formData.age}
              keyboardType="numeric"
              mode="outlined"
              theme={{ roundness: 10 }}
              outlineColor="#BBDEFB"
              activeOutlineColor="#1976D2"
              style={styles.input}
              editable={false}
            />
            {errors.age && <Text style={styles.error}>{errors.age}</Text>}
          </View>

          {/* ── Occupation & Education (NEW) ── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Occupation & Education</Text>

            {/* Occupation */}
            <View
              style={{ width: '100%' }}
              onLayout={e => setOccupationMenuWidth(e.nativeEvent.layout.width)}
            >
              <Menu
                visible={occupationMenuVisible}
                onDismiss={() => setOccupationMenuVisible(false)}
                contentStyle={{ width: occupationMenuWidth }}
                anchor={
                  <TouchableOpacity onPress={() => setOccupationMenuVisible(true)}>
                    <View pointerEvents="none">
                      <TextInput
                        label="Occupation *"
                        value={occupation}
                        mode="outlined"
                        theme={{ roundness: 10 }}
                        outlineColor={occupationMenuVisible ? '#1976D2' : '#BBDEFB'}
                        activeOutlineColor="#1976D2"
                        style={styles.input}
                        editable={false}
                        right={<TextInput.Icon icon="chevron-down" />}
                      />
                    </View>
                  </TouchableOpacity>
                }
              >
                {OCCUPATION_OPTIONS.map(opt => (
                  <Menu.Item key={opt} title={opt} onPress={() => handleOccupationSelect(opt)} />
                ))}
              </Menu>
            </View>
            {errors.occupation && <Text style={styles.error}>{errors.occupation}</Text>}

            {/* Occupation Details — Employed / Self Employed only */}
            {showOccupationDetails && (
              <>
                <TextInput
                  label="Occupation Details *"
                  value={occupationDetails}
                  onChangeText={setOccupationDetails}
                  multiline
                  mode="outlined"
                  theme={{ roundness: 10 }}
                  outlineColor="#BBDEFB"
                  activeOutlineColor="#1976D2"
                  style={styles.input}
                />
                {errors.occupationDetails && <Text style={styles.error}>{errors.occupationDetails}</Text>}
              </>
            )}

            {/* Educational Qualification — shown once any occupation is selected */}
            {showEducationSection && (
              <>
                <TextInput
                  label="Educational Qualification *"
                  value={qualification}
                  onChangeText={setQualification}
                  mode="outlined"
                  theme={{ roundness: 10 }}
                  outlineColor="#BBDEFB"
                  activeOutlineColor="#1976D2"
                  style={styles.input}
                />
                {errors.qualification && <Text style={styles.error}>{errors.qualification}</Text>}
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

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
                  style={[styles.pickerItem, selectedCountry?.countryId === item.countryId && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setSelectedState(null);
                    setStates([]);
                    setCountryModal(false);
                    loadStates(item.countryId);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedCountry?.countryId === item.countryId && styles.pickerItemTextActive]}>
                    {item.countryName}
                  </Text>
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
                  style={[styles.pickerItem, selectedState?.stateId === item.stateId && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedState(item);
                    setStateModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedState?.stateId === item.stateId && styles.pickerItemTextActive]}>
                    {item.stateName}
                  </Text>
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
    </View>
  );
};



export default ProfileEditScreen;

