import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Modal, FlatList, Switch, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { clubService } from '../services/clubService';
import { memberService } from '../services/memberService';
import { BASE_URL } from '../utils/api';

const CLUB_TYPES = ['Lions', 'Rotary', 'NGO', 'Professional', 'Sports', 'Cultural', 'Educational', 'Other'];

export default function ClubFormScreen({ route, navigation }) {
  const { clubId } = route.params || {};
  const isEditMode = !!clubId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});

  // ── Lookup data ───────────────────────────────────────────────────────────
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [members, setMembers] = useState([]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // ── Date picker state ─────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Logo state ────────────────────────────────────────────────────────────
  const [logoUri, setLogoUri] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    clubName: '',
    clubCode: '',
    description: '',
    countryId: null,
    countryName: '',
    stateId: null,
    stateName: '',
    city: '',
    district: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    contactPersonName: '',
    contactNumber: '',
    alternateNumber: '',
    email: '',
    website: '',
    clubType: '',
    establishedDate: '',
    totalMembers: '',
    adminMembers: [],
    registrationNumber: '',
    isActive: true,
  });

  useEffect(() => {
    loadLookups();
    if (isEditMode) {
      loadClub();
    } else {
      fetchNextCode();
    }
  }, []);

  const fetchNextCode = async () => {
    const res = await clubService.getNextCode();
    if (res.success && res.data?.code) set('clubCode', res.data.code);
  };

  const loadLookups = async () => {
    const [cRes, mRes] = await Promise.all([
      clubService.getCountries(),
      memberService.getAllMembers(1, 500),
    ]);
    if (cRes.success) setCountries(cRes.data || []);
    if (mRes.success) setMembers((mRes.data || []).filter(m => m.membershipStatus === 'Active'));
  };

  const loadClub = async () => {
    const res = await clubService.getById(clubId);
    if (res.success && res.data) {
      const d = res.data;
      const adminMembers = [];
      if (d.adminMemberIds) {
        const ids = d.adminMemberIds.split(',').map(s => s.trim());
        const names = (d.adminMemberNames || '').split(',').map(s => s.trim());
        ids.forEach((id, i) => {
          if (id) adminMembers.push({ memberId: parseInt(id, 10), fullName: names[i] || id });
        });
      }
      setForm({
        clubName:           d.clubName || '',
        clubCode:           d.clubCode || '',
        description:        d.description || '',
        countryId:          d.countryId || null,
        countryName:        d.countryName || '',
        stateId:            d.stateId || null,
        stateName:          d.stateName || '',
        city:               d.city || '',
        district:           d.district || '',
        addressLine1:       d.addressLine1 || '',
        addressLine2:       d.addressLine2 || '',
        pincode:            d.pincode || '',
        contactPersonName:  d.contactPersonName || '',
        contactNumber:      d.contactNumber || '',
        alternateNumber:    d.alternateNumber || '',
        email:              d.email || '',
        website:            d.website || '',
        clubType:           d.clubType || '',
        establishedDate:    d.establishedDate ? d.establishedDate.split('T')[0] : '',
        totalMembers:       d.totalMembers != null ? String(d.totalMembers) : '',
        adminMembers,
        registrationNumber: d.registrationNumber || '',
        isActive:           d.isActive !== false,
      });
      if (d.logoPath) {
        setExistingLogo(`${BASE_URL}/Uploads/${d.logoPath.replace(/\\/g, '/')}`);
      }
      if (d.countryId) loadStates(d.countryId);
    }
    setLoading(false);
  };

  const loadStates = async (countryId) => {
    const res = await clubService.getStatesByCountry(countryId);
    if (res.success) setStates(res.data || []);
  };

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ── Logo picker ───────────────────────────────────────────────────────────
  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // ── Country / State ───────────────────────────────────────────────────────
  const selectCountry = async (country) => {
    set('countryId', country.countryId);
    set('countryName', country.countryName);
    set('stateId', null);
    set('stateName', '');
    setStates([]);
    setCountryModal(false);
    await loadStates(country.countryId);
  };

  const selectState = (state) => {
    set('stateId', state.stateId);
    set('stateName', state.stateName);
    setStateModal(false);
  };

  // ── Multi-admin ───────────────────────────────────────────────────────────
  const toggleAdminMember = (member) => {
    setForm(prev => {
      const exists = prev.adminMembers.some(m => m.memberId === member.memberId);
      return {
        ...prev,
        adminMembers: exists
          ? prev.adminMembers.filter(m => m.memberId !== member.memberId)
          : [...prev.adminMembers, { memberId: member.memberId, fullName: member.fullName }],
      };
    });
  };

  const removeAdmin = (memberId) => {
    setForm(prev => ({
      ...prev,
      adminMembers: prev.adminMembers.filter(m => m.memberId !== memberId),
    }));
  };

  const filteredMembers = members.filter(m =>
    m.fullName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // ── Date picker ───────────────────────────────────────────────────────────
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 200);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    // Club Name — mandatory, max 200
    

    // Club Code — mandatory
    if (!form.clubCode.trim()) {
      e.clubCode = 'Club Code is required.';
    }

    // Country — mandatory
    if (!form.countryId) {
      e.countryId = 'Country is required.';
    }

    // State — mandatory
    if (!form.stateId) {
      e.stateId = 'State is required.';
    }
    // Club Name — alphabets only (letters + spaces)
if (!form.clubName.trim()) {
  e.clubName = 'Club Name is required.';
} else if (!/^[A-Za-z\s]+$/.test(form.clubName.trim())) {
  e.clubName = 'Club Name must contain alphabets only.';
}

// Description — no special chars except - . , /
if (form.description && /[^A-Za-z0-9\s\-.,/]/.test(form.description)) {
  e.description = 'Description allows only letters, numbers, spaces and - . , /';
}

// City — alphabets only
if (!form.city.trim()) {
  e.city = 'City is required.';
} else if (!/^[A-Za-z\s]+$/.test(form.city.trim())) {
  e.city = 'City must contain alphabets only.';
}

// District — alphabets only
if (!form.district.trim()) {
  e.district = 'District is required.';
} else if (!/^[A-Za-z\s]+$/.test(form.district.trim())) {
  e.district = 'District must contain alphabets only.';
}

    // Pincode — numbers only, max 10
    if (form.pincode && !/^\d+$/.test(form.pincode)) {
      e.pincode = 'Pincode must contain numbers only.';
    }

    // Address Line 1 — mandatory, max 250, allow letters/digits/space/.,/-
    if (!form.addressLine1.trim()) {
      e.addressLine1 = 'Address Line 1 is required.';
    } else if (form.addressLine1.length > 250) {
      e.addressLine1 = 'Address Line 1 must be at most 250 characters.';
    } else if (/[^A-Za-z0-9\s.,\-/]/.test(form.addressLine1)) {
      e.addressLine1 = 'Address Line 1 allows only letters, numbers, spaces and . , - /';
    }

    // Address Line 2 — optional, max 250, allow letters/digits/space/.,
    if (form.addressLine2) {
      if (form.addressLine2.length > 250) {
        e.addressLine2 = 'Address Line 2 must be at most 250 characters.';
      } else if (/[^A-Za-z0-9\s.,]/.test(form.addressLine2)) {
        e.addressLine2 = 'Address Line 2 allows only letters, numbers, spaces and . ,';
      }
    }

   // In validate()
if (!form.contactPersonName.trim()) {
  e.contactPersonName = 'Contact Person is required.';
} else if (!/^[A-Za-z\s]+$/.test(form.contactPersonName.trim())) {
  e.contactPersonName = 'Contact Person must contain alphabets only.';
} else if (form.contactPersonName.length > 150) {
  e.contactPersonName = 'Contact Person must be at most 150 characters.';
}
    // Contact Number — mandatory, numbers only
    if (!form.contactNumber.trim()) {
      e.contactNumber = 'Contact Number is required.';
    } else if (!/^\d+$/.test(form.contactNumber)) {
      e.contactNumber = 'Contact Number must contain numbers only.';
    }

    // Email — mandatory, valid format
    // Allow domains like .com  .com.au  .edu.in
    // Reject repeated TLDs like .com.com  .au.au
    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!form.email.includes('@')) {
      e.email = 'Invalid email — missing @.';
    } else {
      const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z]{2,})+$/;
      const repeatedTLD = /(\.[A-Za-z]{2,})\1+/; // catches .com.com, .au.au
      if (!emailRegex.test(form.email)) {
        e.email = 'Invalid email address.';
      } else if (repeatedTLD.test(form.email.split('@')[1])) {
        e.email = 'Invalid email — repeated domain extension (e.g. .com.com).';
      }
    }

    // Club Type — mandatory
    if (!form.clubType) {
      e.clubType = 'Club Type is required.';
    }

    // Established Date — mandatory
    if (!form.establishedDate) {
      e.establishedDate = 'Established Date is required.';
    }
// Total Members — max 4 digits
if (form.totalMembers && form.totalMembers.length > 4) {
  e.totalMembers = 'Total Members must be at most 4 digits.';
}

// Registration Number — alphanumeric, max 15
if (form.registrationNumber) {
  if (!/^[A-Za-z0-9]+$/.test(form.registrationNumber)) {
    e.registrationNumber = 'Registration Number must be alphanumeric.';
  } else if (form.registrationNumber.length > 15) {
    e.registrationNumber = 'Registration Number must be max 15 characters.';
  }
}
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
debugger;
    setSaving(true);

    const payload = {
      clubName:           form.clubName.trim(),
      clubCode:           form.clubCode.trim() || null,
      description:        form.description.trim() || null,
      countryId:          form.countryId,
      stateId:            form.stateId,
      city:               form.city.trim() || null,
      district:           form.district.trim() || null,
      addressLine1:       form.addressLine1.trim() || null,
      addressLine2:       form.addressLine2.trim() || null,
      pincode:            form.pincode.trim() || null,
      contactPersonName:  form.contactPersonName.trim() || null,
      contactNumber:      form.contactNumber.trim() || null,
      alternateNumber:    form.alternateNumber.trim() || null,
      email:              form.email.trim() || null,
      website:            form.website.trim() || null,
      clubType:           form.clubType || null,
      establishedDate:    form.establishedDate || null,
      totalMembers:       form.totalMembers ? parseInt(form.totalMembers, 10) : 0,
      adminMemberIds:     form.adminMembers.length ? form.adminMembers.map(m => m.memberId).join(',') : null,
      adminMemberNames:   form.adminMembers.length ? form.adminMembers.map(m => m.fullName).join(', ') : null,
      registrationNumber: form.registrationNumber.trim() || null,
      isActive:           form.isActive,
    };

    const res = isEditMode
      ? await clubService.update(clubId, payload)
      : await clubService.create(payload);

    if (!res.success) {
      setSaving(false);
      Alert.alert('Error', res.message || 'Something went wrong.');
      return;
    }
debugger;
    const savedId = isEditMode ? clubId : res.data?.clubId;

    if (logoUri && savedId) {
      const fileName = logoUri.split('/').pop();
      await clubService.uploadLogo(savedId, logoUri, fileName);
    }

    setSaving(false);
    Alert.alert('Success', isEditMode ? 'Club updated.' : 'Club created.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  const logoSource = logoUri ? { uri: logoUri } : existingLogo ? { uri: existingLogo } : null;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Club' : 'Add Club'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#D4A017" />
            : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Club Logo ── */}
        <View style={styles.logoSection}>
          <TouchableOpacity style={styles.logoBox} onPress={pickLogo} activeOpacity={0.8}>
            {logoSource ? (
              <Image source={logoSource} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="camera" size={32} color="#aaa" />
                <Text style={styles.logoPlaceholderText}>Add Logo</Text>
              </View>
            )}
          </TouchableOpacity>
          {logoSource && (
            <TouchableOpacity style={styles.changeLogoBtn} onPress={pickLogo}>
              <Text style={styles.changeLogoText}>Change Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Basic Details ── */}
        <SectionHeader title="Basic Details" />

        <Field label="Club Name *">
          <TextInput
            style={[styles.input, errors.clubName && styles.inputError]}
            value={form.clubName}
onChangeText={v => set('clubName', v.replace(/[^A-Za-z\s]/g, '').slice(0, 200))}            placeholder="Enter club name"
            placeholderTextColor="#bbb"
            maxLength={200}
          />
        </Field>
        {errors.clubName && <Text style={styles.error}>{errors.clubName}</Text>}

        <Field label="Club Code *">
          <View style={styles.codeRow}>
            <TextInput
              style={[styles.input, styles.codeInput, errors.clubCode && styles.inputError]}
              value={form.clubCode}
              onChangeText={v => set('clubCode', v)}
              placeholder="e.g. CLB-AB12"
              placeholderTextColor="#bbb"
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.regenBtn} onPress={fetchNextCode} activeOpacity={0.75}>
              <Ionicons name="refresh" size={18} color="#1E3A5F" />
            </TouchableOpacity>
          </View>
        </Field>
        {errors.clubCode && <Text style={styles.error}>{errors.clubCode}</Text>}

       <Field label="Description">
  <TextInput
    style={[styles.input, styles.textarea, errors.description && styles.inputError]}
    value={form.description}
    onChangeText={v => set('description', v.replace(/[^A-Za-z0-9\s\-.,/]/g, ''))}
    placeholder="Brief description"
    placeholderTextColor="#bbb"
    multiline
    numberOfLines={3}
    textAlignVertical="top"
  />
</Field>
{errors.description && <Text style={styles.error}>{errors.description}</Text>}

        {/* ── Location Details ── */}
        <SectionHeader title="Location Details" />

        <Field label="Country *">
          <TouchableOpacity
            style={[styles.selector, errors.countryId && styles.selectorError]}
            onPress={() => setCountryModal(true)}
          >
            <Text style={form.countryName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.countryName || 'Select country'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        {errors.countryId && <Text style={styles.error}>{errors.countryId}</Text>}

        <Field label="State *">
          <TouchableOpacity
            style={[styles.selector, !form.countryId && styles.selectorDisabled, errors.stateId && styles.selectorError]}
            onPress={() => form.countryId && setStateModal(true)}
          >
            <Text style={form.stateName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.stateName || (form.countryId ? 'Select state' : 'Select country first')}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        {errors.stateId && <Text style={styles.error}>{errors.stateId}</Text>}

        
          <Row>
  <Field label="City *" flex>
    <TextInput
      style={[styles.input, errors.city && styles.inputError]}
      value={form.city}
     onChangeText={v => set('city', v.replace(/[^A-Za-z\s]/g, ''))}
      placeholder="Enter city"
      placeholderTextColor="#bbb"
    />
    {errors.city && <Text style={styles.error}>{errors.city}</Text>}
  </Field>

  <Field label="District *" flex>
    <TextInput
      style={[styles.input, errors.district && styles.inputError]}
      value={form.district}
     onChangeText={v => set('district', v.replace(/[^A-Za-z\s]/g, ''))}
      placeholder="Enter district"
      placeholderTextColor="#bbb"
    />
    {errors.district && <Text style={styles.error}>{errors.district}</Text>}
  </Field>
</Row>
        <Field label="Address Line 1 *">
         <TextInput
  style={[styles.input, styles.textarea, errors.addressLine1 && styles.inputError]}
  value={form.addressLine1}
  onChangeText={v => set('addressLine1', v.slice(0, 250))}
  placeholder="Street / Building"
  placeholderTextColor="#bbb"
  maxLength={250}
  multiline
  numberOfLines={3}
  textAlignVertical="top"
/>
        </Field>
        {errors.addressLine1 && <Text style={styles.error}>{errors.addressLine1}</Text>}

        <Field label="Address Line 2">
         <TextInput
  style={[styles.input, styles.textarea, errors.addressLine2 && styles.inputError]}
  value={form.addressLine2}
  onChangeText={v => set('addressLine2', v.slice(0, 250))}
  placeholder="Area / Landmark"
  placeholderTextColor="#bbb"
  maxLength={250}
  multiline
  numberOfLines={3}
  textAlignVertical="top"
/>
        </Field>
        {errors.addressLine2 && <Text style={styles.error}>{errors.addressLine2}</Text>}

        <Field label="Pincode">
          <TextInput
            style={[styles.input, errors.pincode && styles.inputError]}
            value={form.pincode}
            onChangeText={v => set('pincode', v.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="Pincode"
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
            maxLength={10}
          />
        </Field>
        {errors.pincode && <Text style={styles.error}>{errors.pincode}</Text>}

        {/* ── Contact Details ── */}
        <SectionHeader title="Contact Details" />

        <Field label="Contact Person *">
          <TextInput
            style={[styles.input, errors.contactPersonName && styles.inputError]}
            value={form.contactPersonName}
            onChangeText={v => set('contactPersonName', v.slice(0, 150))}
            placeholder="Contact person name"
            placeholderTextColor="#bbb"
            maxLength={150}
          />
        </Field>
        {errors.contactPersonName && <Text style={styles.error}>{errors.contactPersonName}</Text>}

        <Row>
          <Field label="Phone *" flex>
            <TextInput
              style={[styles.input, errors.contactNumber && styles.inputError]}
              value={form.contactNumber}
              onChangeText={v => set('contactNumber', v.replace(/[^0-9]/g, ''))}
              placeholder="+91 XXXXXXXXXX"
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
                maxLength={10}
            />
          </Field>
          <Field label="Alternate" flex>
            <TextInput
              style={styles.input}
              value={form.alternateNumber}
              onChangeText={v => set('alternateNumber', v.replace(/[^0-9]/g, ''))}
              placeholder="Alternate no."
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
                maxLength={10}
            />
          </Field>
        </Row>
        {errors.contactNumber && <Text style={[styles.error, { paddingHorizontal: 16 }]}>{errors.contactNumber}</Text>}

        <Field label="Email *">
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={form.email}
            onChangeText={v => set('email', v)}
            placeholder="club@example.com"
            placeholderTextColor="#bbb"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <Field label="Website">
          <TextInput
            style={styles.input}
            value={form.website}
            onChangeText={v => set('website', v)}
            placeholder="https://..."
            placeholderTextColor="#bbb"
            keyboardType="url"
            autoCapitalize="none"
          />
        </Field>

        {/* ── Club Info ── */}
        <SectionHeader title="Club Info" />

        <Field label="Club Type *">
          <TouchableOpacity
            style={[styles.selector, errors.clubType && styles.selectorError]}
            onPress={() => setTypeModal(true)}
          >
            <Text style={form.clubType ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.clubType || 'Select club type'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        {errors.clubType && <Text style={styles.error}>{errors.clubType}</Text>}

        {/* ── Established Date — Date Picker ── */}
        <Field label="Established Date *">
          <TouchableOpacity
            style={[styles.selector, errors.establishedDate && styles.selectorError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={form.establishedDate ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.establishedDate || 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#888" />
          </TouchableOpacity>
        </Field>
        {errors.establishedDate && <Text style={styles.error}>{errors.establishedDate}</Text>}
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
                set('establishedDate', formatDate(date));
              }
            }}
          />
        )}

        <Row>
          <Field label="Total Members" flex>
            <TextInput
  style={styles.input}
  value={form.totalMembers}
  onChangeText={v => set('totalMembers', v.replace(/[^0-9]/g, '').slice(0, 4))}
  placeholder="0"
  placeholderTextColor="#bbb"
  keyboardType="number-pad"
  maxLength={4}
/>
{errors.totalMembers && (
  <Text style={[styles.error, { paddingHorizontal: 16 }]}>
    {errors.totalMembers}
  </Text>
)}
          </Field>
          <Field label="Reg. Number" flex>
            <TextInput
  style={[styles.input, errors.registrationNumber && styles.inputError]}
  value={form.registrationNumber}
  onChangeText={v =>
    set('registrationNumber', v.replace(/[^A-Za-z0-9]/g, '').slice(0, 15))
  }
  placeholder="Registration no."
  placeholderTextColor="#bbb"
  maxLength={15}
/>
{errors.registrationNumber && <Text style={styles.error}>{errors.registrationNumber}</Text>}
          </Field>
        </Row>

        {/* ── Admin Members (multi-select) ── */}
        <Field label="Admin Members">
          {form.adminMembers.length > 0 && (
            <View style={styles.chipWrap}>
              {form.adminMembers.map(m => (
                <View key={m.memberId} style={styles.adminChip}>
                  <Text style={styles.adminChipText}>{m.fullName}</Text>
                  <TouchableOpacity onPress={() => removeAdmin(m.memberId)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Ionicons name="close-circle" size={16} color="#1E3A5F" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.selector, { marginTop: form.adminMembers.length ? 8 : 0 }]}
            onPress={() => setMemberModal(true)}
          >
            <Text style={styles.selectorPlaceholder}>
              {form.adminMembers.length ? '+ Add more admins' : 'Select admin members'}
            </Text>
            <Ionicons name="people" size={16} color="#888" />
          </TouchableOpacity>
        </Field>

        {/* ── Status ── */}
        <SectionHeader title="Status" />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Active</Text>
          <Switch
            value={form.isActive}
            onValueChange={v => set('isActive', v)}
            trackColor={{ false: '#ddd', true: '#1E3A5F' }}
            thumbColor={form.isActive ? '#D4A017' : '#f4f3f4'}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Country Modal ── */}
      <PickerModal
        visible={countryModal}
        title="Select Country"
        items={countries}
        keyProp="countryId"
        labelProp="countryName"
        onSelect={selectCountry}
        onClose={() => setCountryModal(false)}
      />

      {/* ── State Modal ── */}
      <PickerModal
        visible={stateModal}
        title="Select State"
        items={states}
        keyProp="stateId"
        labelProp="stateName"
        onSelect={selectState}
        onClose={() => setStateModal(false)}
      />

      {/* ── Club Type Modal ── */}
      <PickerModal
        visible={typeModal}
        title="Select Club Type"
        items={CLUB_TYPES.map(t => ({ id: t, label: t }))}
        keyProp="id"
        labelProp="label"
        onSelect={item => { set('clubType', item.label); setTypeModal(false); }}
        onClose={() => setTypeModal(false)}
      />

      {/* ── Multi-Admin Member Modal ── */}
      <Modal visible={memberModal} animationType="slide" transparent onRequestClose={() => setMemberModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Admin Members</Text>
            <Text style={styles.modalSubtitle}>Tap to select/deselect. Tap Done when finished.</Text>
            <TextInput
              style={styles.modalSearch}
              value={memberSearch}
              onChangeText={setMemberSearch}
              placeholder="Search member..."
              placeholderTextColor="#bbb"
            />
            <FlatList
              data={filteredMembers}
              keyExtractor={m => String(m.memberId)}
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => {
                const selected = form.adminMembers.some(m => m.memberId === item.memberId);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    onPress={() => toggleAdminMember(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{item.fullName}</Text>
                      {item.email ? <Text style={styles.modalItemSub}>{item.email}</Text> : null}
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#1E3A5F" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.modalEmpty}>No active members found</Text>}
            />
            <TouchableOpacity style={styles.modalDone} onPress={() => { setMemberModal(false); setMemberSearch(''); }}>
              <Text style={styles.modalDoneText}>Done ({form.adminMembers.length} selected)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Field({ label, children, flex }) {
  return (
    <View style={[styles.field, flex && styles.fieldFlex]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }) {
  return <View style={styles.row}>{children}</View>;
}

function PickerModal({ visible, title, items, keyProp, labelProp, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={item => String(item[keyProp])}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
                <Text style={styles.modalItemText}>{item[labelProp]}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.modalEmpty}>No options available</Text>}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#F0F2F5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:      { backgroundColor: '#1E3A5F', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 44 : 54, paddingBottom: 14 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerBtn:   { padding: 4, minWidth: 48 },
  saveText:    { color: '#D4A017', fontSize: 16, fontWeight: '700', textAlign: 'right' },

  scroll: { paddingBottom: 40 },

  // Logo
  logoSection:         { alignItems: 'center', paddingVertical: 20, backgroundColor: '#fff', marginBottom: 2 },
  logoBox:             { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', backgroundColor: '#F0F2F5', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  logoImage:           { width: '100%', height: '100%' },
  logoPlaceholder:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderText: { fontSize: 12, color: '#aaa', marginTop: 4 },
  changeLogoBtn:       { marginTop: 10 },
  changeLogoText:      { fontSize: 13, color: '#1E3A5F', fontWeight: '600' },

  sectionHeader: { backgroundColor: '#E8EDF5', paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: '#1E3A5F', textTransform: 'uppercase', letterSpacing: 0.6 },

  field:      { paddingHorizontal: 16, paddingTop: 12 },
  fieldFlex:  { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '600' },

  input:      { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111' },
  inputError: { borderColor: '#D32F2F', borderWidth: 1.5 },
  codeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeInput:  { flex: 1 },
  regenBtn:   { width: 42, height: 42, borderRadius: 10, backgroundColor: '#EBF0FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D0DBF0' },
  textarea:   { minHeight: 80 },

  selector:            { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorDisabled:    { backgroundColor: '#F5F5F5', borderColor: '#E8E8E8' },
  selectorError:       { borderColor: '#D32F2F', borderWidth: 1.5 },
  selectorValue:       { fontSize: 14, color: '#111', flex: 1 },
  selectorPlaceholder: { fontSize: 14, color: '#bbb', flex: 1 },

  error: { color: '#D32F2F', fontSize: 12, marginTop: 4, marginBottom: 4, paddingHorizontal: 16 },

  row: { flexDirection: 'row' },

  // Admin chips
  chipWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  adminChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF0FA', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  adminChipText: { fontSize: 13, color: '#1E3A5F', fontWeight: '600' },

  switchRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', marginTop: 2 },
  switchLabel: { fontSize: 15, color: '#333', fontWeight: '600' },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle:    { fontSize: 17, fontWeight: '700', color: '#1E3A5F', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#888', marginBottom: 10 },
  modalSearch:   { backgroundColor: '#F0F2F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14, color: '#111' },

  modalItem:             { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' },
  modalItemSelected:     { backgroundColor: '#EBF0FA', paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
  modalItemText:         { fontSize: 15, color: '#111' },
  modalItemTextSelected: { color: '#1E3A5F', fontWeight: '600' },
  modalItemSub:          { fontSize: 12, color: '#888', marginTop: 2 },
  modalEmpty:            { textAlign: 'center', color: '#888', paddingVertical: 24 },

  modalDone:       { marginTop: 14, backgroundColor: '#1E3A5F', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalDoneText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCancel:     { marginTop: 12, backgroundColor: '#F0F2F5', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: '#1E3A5F', fontWeight: '600' },
});