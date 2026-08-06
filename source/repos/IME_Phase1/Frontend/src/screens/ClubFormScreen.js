import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, Switch, Platform, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { clubService } from '../services/clubService';
import { memberService } from '../services/memberService';
import api from '../utils/api';
import { ClubFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
//import AdminSignupScreen from '../screens/AddAdminScreen';

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const CLUB_TYPES = ['Lions', 'Rotary', 'NGO', 'Professional', 'Sports', 'Cultural', 'Educational', 'Other'];

// ── Styled TextInput — matches AchievementFormScreen/JobPostingFormScreen ──
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

export default function ClubFormScreen({ route, navigation }) {
  const { clubId } = route.params || {};
  const isEditMode = !!clubId;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [members, setMembers] = useState([]);
  const [clubMembers, setClubMembers] = useState([]);

  const [countryModal, setCountryModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [typeModal, setTypeModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const [adminMode, setAdminMode] = useState(isEditMode ? 'existing' : 'new');

  const { width: screenWidth } = useWindowDimensions();
  const isLargeScreen = screenWidth >= 600; // tablet / web breakpoint

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [logoUri, setLogoUri] = useState(null);
  const [existingLogo, setExistingLogo] = useState(null);

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
      debugger;
      loadClub();
      loadClubMembers(clubId);
    } else {
      fetchNextCode();
      setAdminMode('new');
    }
  }, []);

  // ── Handle a newly-created admin returning from the AdminSignup screen ──
  useEffect(() => {
    if (route.params?.newAdminMember) {
      const member = route.params.newAdminMember;

      setForm(prev => ({
        ...prev,
        adminMembers: [
          {
            memberId: member.memberId,
            fullName: member.fullName,
          },
        ],
      }));

      if (isEditMode) {
        // Add the newly created member into the "existing member" dropdown
        // source so they show up there too, and switch to the existing-member
        // selector so their name appears in the dropdown/text input.
        setClubMembers(prev => {
          const exists = prev.some(m => m.memberId === member.memberId);
          return exists ? prev : [...prev, member];
        });
        setAdminMode('existing');
      } else {
        setMembers(prev => {
          const exists = prev.some(m => m.memberId === member.memberId);
          return exists ? prev : [...prev, member];
        });
        setAdminMode('new');
      }

      navigation.setParams({
        newAdminMember: undefined,
      });
    }
  }, [route.params?.newAdminMember]);

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

  const loadClubMembers = async (id) => {
    debugger;
    if (!id) return;
    const res = await memberService.getMembersByClub(id);
    if (res.success) {
      setClubMembers((res.data || []).filter(m => m.membershipStatus === 'Active'));
    }
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
        setExistingLogo(toPublicUrl(d.logoPath));
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

  const handleNewAdminCreated = (member) => {
    setForm(prev => ({
      ...prev,
      adminMembers: [
        ...prev.adminMembers,
        {
          memberId: member.memberId,
          fullName: member.fullName,
        },
      ],
    }));

    Alert.alert(
      'Admin Added',
      `${member.fullName} added successfully.`
    );
  };

  const memberSource = isEditMode ? clubMembers : members;
  const filteredMembers = memberSource.filter(m =>
    m.fullName?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 200);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const validate = () => {
    const e = {};

    if (!form.clubCode.trim()) {
      e.clubCode = 'Club Code is required.';
    }

    if (!form.countryId) {
      e.countryId = 'Country is required.';
    }

    if (!form.stateId) {
      e.stateId = 'State is required.';
    }

    if (!form.clubName.trim()) {
      e.clubName = 'Club Name is required.';
    } else if (!/^[A-Za-z\s]+$/.test(form.clubName.trim())) {
      e.clubName = 'Club Name must contain alphabets only.';
    }

    if (form.description && /[^A-Za-z0-9\s\-.,/]/.test(form.description)) {
      e.description = 'Description allows only letters, numbers, spaces and - . , /';
    }

    if (!form.city.trim()) {
      e.city = 'City is required.';
    } else if (!/^[A-Za-z\s]+$/.test(form.city.trim())) {
      e.city = 'City must contain alphabets only.';
    }

    if (!form.district.trim()) {
      e.district = 'District is required.';
    } else if (!/^[A-Za-z\s]+$/.test(form.district.trim())) {
      e.district = 'District must contain alphabets only.';
    }

    if (form.pincode && !/^\d+$/.test(form.pincode)) {
      e.pincode = 'Pincode must contain numbers only.';
    }

    if (!form.addressLine1.trim()) {
      e.addressLine1 = 'Address Line 1 is required.';
    } else if (form.addressLine1.length > 250) {
      e.addressLine1 = 'Address Line 1 must be at most 250 characters.';
    } else if (/[^A-Za-z0-9\s.,\-/]/.test(form.addressLine1)) {
      e.addressLine1 = 'Address Line 1 allows only letters, numbers, spaces and . , - /';
    }

    if (form.addressLine2) {
      if (form.addressLine2.length > 250) {
        e.addressLine2 = 'Address Line 2 must be at most 250 characters.';
      } else if (/[^A-Za-z0-9\s.,]/.test(form.addressLine2)) {
        e.addressLine2 = 'Address Line 2 allows only letters, numbers, spaces and . ,';
      }
    }

    if (!form.contactPersonName.trim()) {
      e.contactPersonName = 'Contact Person is required.';
    } else if (!/^[A-Za-z\s]+$/.test(form.contactPersonName.trim())) {
      e.contactPersonName = 'Contact Person must contain alphabets only.';
    } else if (form.contactPersonName.length > 150) {
      e.contactPersonName = 'Contact Person must be at most 150 characters.';
    }

    if (!form.contactNumber.trim()) {
      e.contactNumber = 'Contact Number is required.';
    } else if (!/^\d+$/.test(form.contactNumber)) {
      e.contactNumber = 'Contact Number must contain numbers only.';
    }

    if (!form.email.trim()) {
      e.email = 'Email is required.';
    } else if (!form.email.includes('@')) {
      e.email = 'Invalid email — missing @.';
    } else {
      const emailRegex = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z]{2,})+$/;
      const repeatedTLD = /(\.[A-Za-z]{2,})\1+/;
      if (!emailRegex.test(form.email)) {
        e.email = 'Invalid email address.';
      } else if (repeatedTLD.test(form.email.split('@')[1])) {
        e.email = 'Invalid email — repeated domain extension (e.g. .com.com).';
      }
    }

    if (!form.clubType) {
      e.clubType = 'Club Type is required.';
    }

    if (!form.establishedDate) {
      e.establishedDate = 'Established Date is required.';
    }

    if (form.totalMembers && form.totalMembers.length > 4) {
      e.totalMembers = 'Total Members must be at most 4 digits.';
    }

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

  const handleSave = async () => {
    if (!validate()) return;

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
      Alert.alert('Error', getSafeErrorMessage(res));
      return;
    }

    const savedId = isEditMode ? clubId : res.data?.clubId;

    if (logoUri && savedId) {
      const fileName = logoUri.split('/').pop();
      await clubService.uploadLogo(savedId, logoUri, fileName);
    }
    if (savedId && form.adminMembers.length > 0) {
      const memberIds = form.adminMembers
        .map(m => m.memberId)
        .join(',');

      await clubService.updateClubByMemberId(
        memberIds,
        savedId
      );
    }

    setSaving(false);
    Alert.alert('Success', isEditMode ? 'Club updated.' : 'Club created.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const logoSource = logoUri ? { uri: logoUri } : existingLogo ? { uri: existingLogo } : null;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <GradientHeader style={styles.header}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={COLORS.white} />
        </TouchableOpacity> */}
        <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.navSide}
                disabled={saving}
              >
                <Text style={styles.navCancel}>Cancel</Text>
              </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Club' : 'Add Club'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving || loading}>
          {saving || loading
            ? <ActivityIndicator size="small" color={COLORS.accent} />
            : <Text style={styles.saveText}>Save</Text>}
        </TouchableOpacity>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Club Logo — styled like Achievement's attachment upload ── */}
        {/*<View style={styles.logoSection}>
          <TouchableOpacity style={styles.logoBox} onPress={pickLogo} activeOpacity={0.8}>
            {logoSource ? (
              <Image source={logoSource} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ fontSize: 22 }}>📷</Text>
                <Text style={styles.logoPlaceholderText}>Add Logo</Text>
              </View>
            )}
          </TouchableOpacity>
          {logoSource && (
            <TouchableOpacity style={styles.changeLogoBtn} onPress={pickLogo}>
              <Text style={styles.changeLogoText}>Change Logo</Text>
            </TouchableOpacity>
          )}
        </View>*/}

        {/* ── Basic Details ── */}
      

        <Field label="Club Name" required error={errors.clubName}>
          <StyledInput
            value={form.clubName}
            onChangeText={v => set('clubName', v.replace(/[^A-Za-z\s]/g, '').slice(0, 200))}
            placeholder="Enter club name"
            hasError={!!errors.clubName}
            maxLength={200}
          />
        </Field>

        <Field label="Club Code" required error={errors.clubCode}>
          <View style={styles.codeRow}>
            <StyledInput
              style={styles.codeInput}
              value={form.clubCode}
              onChangeText={v => set('clubCode', v)}
              placeholder="e.g. CLB-AB12"
              hasError={!!errors.clubCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.regenBtn} onPress={fetchNextCode} activeOpacity={0.75}>
              <Ionicons name="refresh" size={18} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </Field>

        <Field label="Description" error={errors.description}>
          <StyledInput
            value={form.description}
            onChangeText={v => set('description', v.replace(/[^A-Za-z0-9\s\-.,/]/g, ''))}
            placeholder="Brief description"
            hasError={!!errors.description}
            multiline
          />
        </Field>

        {/* ── Location Details ── */}
      

        <Field label="Country" required error={errors.countryId}>
          <TouchableOpacity
            style={[styles.selector, errors.countryId && styles.selectorError]}
            onPress={() => setCountryModal(true)}
          >
            <Text style={form.countryName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.countryName || 'Select country'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.placeholder} />
          </TouchableOpacity>
        </Field>

        <Field label="State" required error={errors.stateId}>
          <TouchableOpacity
            style={[styles.selector, !form.countryId && styles.selectorDisabled, errors.stateId && styles.selectorError]}
            onPress={() => form.countryId && setStateModal(true)}
          >
            <Text style={form.stateName ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.stateName || (form.countryId ? 'Select state' : 'Select country first')}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.placeholder} />
          </TouchableOpacity>
        </Field>

        <View style={styles.row}>
          <View style={styles.fieldFlex}>
            <Field label="City" required error={errors.city}>
              <StyledInput
                value={form.city}
                onChangeText={v => set('city', v.replace(/[^A-Za-z\s]/g, ''))}
                placeholder="Enter city"
                hasError={!!errors.city}
              />
            </Field>
          </View>

          <View style={styles.fieldFlex}>
            <Field label="District" required error={errors.district}>
              <StyledInput
                value={form.district}
                onChangeText={v => set('district', v.replace(/[^A-Za-z\s]/g, ''))}
                placeholder="Enter district"
                hasError={!!errors.district}
              />
            </Field>
          </View>
        </View>

        <Field label="Address Line 1" required error={errors.addressLine1}>
          <StyledInput
            value={form.addressLine1}
            onChangeText={v => set('addressLine1', v.slice(0, 250))}
            placeholder="Street / Building"
            hasError={!!errors.addressLine1}
            maxLength={250}
            multiline
          />
        </Field>

        <Field label="Address Line 2" error={errors.addressLine2}>
          <StyledInput
            value={form.addressLine2}
            onChangeText={v => set('addressLine2', v.slice(0, 250))}
            placeholder="Area / Landmark"
            hasError={!!errors.addressLine2}
            maxLength={250}
            multiline
          />
        </Field>

        <Field label="Pincode" error={errors.pincode}>
          <StyledInput
            value={form.pincode}
            onChangeText={v => set('pincode', v.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="Pincode"
            hasError={!!errors.pincode}
            keyboardType="number-pad"
            maxLength={10}
          />
        </Field>

        {/* ── Contact Details ── */}
        

        <Field label="Contact Person" required error={errors.contactPersonName}>
          <StyledInput
            value={form.contactPersonName}
            onChangeText={v => set('contactPersonName', v.slice(0, 150))}
            placeholder="Contact person name"
            hasError={!!errors.contactPersonName}
            maxLength={150}
          />
        </Field>

        <View style={styles.row}>
          <View style={styles.fieldFlex}>
            <Field label="Phone" required error={errors.contactNumber}>
              <StyledInput
                value={form.contactNumber}
                onChangeText={v => set('contactNumber', v.replace(/[^0-9]/g, ''))}
                placeholder="+91 XXXXXXXXXX"
                hasError={!!errors.contactNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </Field>
          </View>
          <View style={styles.fieldFlex}>
            <Field label="Alternate">
              <StyledInput
                value={form.alternateNumber}
                onChangeText={v => set('alternateNumber', v.replace(/[^0-9]/g, ''))}
                placeholder="Alternate no."
                keyboardType="phone-pad"
                maxLength={10}
              />
            </Field>
          </View>
        </View>

        <Field label="Email" required error={errors.email}>
          <StyledInput
            value={form.email}
            onChangeText={v => set('email', v)}
            placeholder="club@example.com"
            hasError={!!errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label="Website">
          <StyledInput
            value={form.website}
            onChangeText={v => set('website', v)}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
          />
        </Field>

        {/* ── Club Info ── */}
      

        <Field label="Club Type" required error={errors.clubType}>
          <TouchableOpacity
            style={[styles.selector, errors.clubType && styles.selectorError]}
            onPress={() => setTypeModal(true)}
          >
            <Text style={form.clubType ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.clubType || 'Select club type'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.placeholder} />
          </TouchableOpacity>
        </Field>

        <Field label="Established Date" required error={errors.establishedDate}>
          <TouchableOpacity
            style={[styles.selector, errors.establishedDate && styles.selectorError]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={form.establishedDate ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.establishedDate || 'Select date'}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.placeholder} />
          </TouchableOpacity>
        </Field>
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

        <View style={styles.row}>
          <View style={styles.fieldFlex}>
            <Field label="Total Members" error={errors.totalMembers}>
              <StyledInput
                value={form.totalMembers}
                onChangeText={v => set('totalMembers', v.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="0"
                hasError={!!errors.totalMembers}
                keyboardType="number-pad"
                maxLength={4}
              />
            </Field>
          </View>
          <View style={styles.fieldFlex}>
            <Field label="Reg. Number" error={errors.registrationNumber}>
              <StyledInput
                value={form.registrationNumber}
                onChangeText={v =>
                  set('registrationNumber', v.replace(/[^A-Za-z0-9]/g, '').slice(0, 15))
                }
                placeholder="Registration no."
                hasError={!!errors.registrationNumber}
                maxLength={15}
              />
            </Field>
          </View>
        </View>

        <Field label="Admin Members" required>

          <View
            style={
              isLargeScreen
                ? {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexWrap: 'nowrap',
                    width: '100%',
                    gap: 12,
                  }
                : undefined
            }
          >
            <View style={[styles.radioRow, isLargeScreen && { flexShrink: 0, flexGrow: 0, width: 'auto' }]}>

              {isEditMode && (
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setAdminMode('existing')}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      adminMode === 'existing' && styles.radioOuterActive,
                    ]}
                  >
                    {adminMode === 'existing' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>

                  <Text style={styles.radioLabel}>
                    Existing Member
                  </Text>
                </TouchableOpacity>
              )}

            </View>

            <TouchableOpacity
              style={[
                styles.addAdminButton,
                isEditMode && !isLargeScreen && { marginTop: 10 },
                isLargeScreen && {
                  alignSelf: 'center',
                  flexGrow: 0,
                  flexShrink: 0,
                  width: 'auto',
                  marginTop: 0,
                },
              ]}
              onPress={() => {
                setAdminMode('new');
                setForm(prev => ({
                  ...prev,
                  adminMembers: [],
                }));
                navigation.navigate('AdminSignup', {
                  hideClubSelection: true,
                  presetClub: {
                    clubId: clubId || null,
                    clubName: form.clubName,
                  },
                });
              }}
            >
              <Ionicons name="person-add-outline" size={17} color={COLORS.dark} />
              <Text style={styles.addAdminButtonText}>
                Click here to add new admin
              </Text>
            </TouchableOpacity>
          </View>

          {adminMode === 'existing' && isEditMode && (
            <TouchableOpacity
              style={[styles.selector,{ marginTop: isLargeScreen ? 6 : 10 }]}
              onPress={() => setMemberModal(true)}
            >
              <Text
                style={
                  form.adminMembers.length
                    ? styles.selectorValue
                    : styles.selectorPlaceholder
                }
                numberOfLines={1}
              >
                {form.adminMembers.length
                  ? form.adminMembers.map(m => m.fullName).join(', ')
                  : 'Select Admin Members'}
              </Text>

              <Ionicons
                name="people"
                size={18}
                color={COLORS.placeholder}
              />
            </TouchableOpacity>
          )}

          {adminMode === 'new' && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.fieldLabel}>
                Newly Added Admin Member
              </Text>

              <View
                style={[
                  styles.selector,
                  {
                    marginTop: 4,
                    minHeight: 48,
                  },
                ]}
              >
                <Text
                  style={
                    form.adminMembers.length
                      ? styles.selectorValue
                      : styles.selectorPlaceholder
                  }
                  numberOfLines={2}
                >
                  {form.adminMembers.length
                    ? form.adminMembers.map(m => m.fullName).join(', ')
                    : 'No admin member added yet'}
                </Text>

                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color={COLORS.placeholder}
                />
              </View>
            </View>
          )}

          {form.adminMembers.length > 0 && (
            <View style={[styles.chipWrap, { marginTop: 10 }]}>
              {form.adminMembers.map(member => (
                <View
                  key={member.memberId}
                  style={styles.adminChip}
                >
                  <Text style={styles.adminChipText}>
                    {member.fullName}
                  </Text>

                  <TouchableOpacity
                    onPress={() => removeAdmin(member.memberId)}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="#D32F2F"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

        </Field>
{/* ── Club Logo — moved here, styled like AddAdminScreen's photo picker ── */}
  <Text style={styles.logoLabel}>Club Logo (Optional)</Text>
  <TouchableOpacity style={styles.logoPickerRow} onPress={pickLogo}>
    {logoSource ? (
      <Image source={logoSource} style={styles.logoPreview} />
    ) : (
      <View style={styles.logoPlaceholderCircle}>
        <Text style={styles.logoPlaceholderIcon}>📷</Text>
      </View>
    )}
    <View style={styles.logoPickerText}>
      <Text style={styles.logoPickerTitle}>
        {logoSource ? 'Logo selected' : 'Upload club logo'}
      </Text>
      <Text style={styles.logoPickerHint}>
        {logoSource ? 'Tap to change' : 'Tap to choose from gallery'}
      </Text>
    </View>
  </TouchableOpacity>
        {/* ── Status ── */}
        
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Active</Text>
          <Switch
            value={form.isActive}
            onValueChange={v => set('isActive', v)}
            trackColor={{ false: '#ddd', true: COLORS.dark }}
            thumbColor={form.isActive ? COLORS.accent : '#f4f3f4'}
          />
        </View>

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

      {/* ── Multi-Admin Member Modal (existing members) ── */}
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
              placeholderTextColor="#CBD5E1"
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
                    {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.dark} />}
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

function Field({ label, required, children, error }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={{ color: '#EF4444' }}> *</Text>}
      </Text>
      {children}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
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