import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
// Place in: src/screens/JobPostingFormScreen.js
// Mirrors AchievementFormScreen.js structure exactly.

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking, TextInput } from 'react-native';
import DOBField from '../components/DOBField';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jobPostingService } from '../services/jobpostingService';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { JobPostingFormScreenChip as chip, JobPostingFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

const EMPLOYMENT_TYPES = ['Full Time', 'Contract', 'Part Time', 'Internship'];
const WORK_MODES       = ['Remote', 'Hybrid', 'Office'];

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server is a raw disk path like "Uploads\jobpostings\xyz.jpg" —
// convert it into a URL the app can actually load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

// ─────────────────────────────────────────────────────────────────────────
// ── Validation & Sanitization Helpers ──────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────

// Field max lengths
const MAX_TITLE    = 150;
const MAX_COMPANY  = 200;
const MAX_LOCATION = 50;
const MAX_ABOUT    = 500;
const MAX_SKILLS   = 500;
const MAX_CONTACT  = 10; // digits

// Job Title: letters, numbers, spaces, dot, hyphen — no other special characters
const TITLE_REGEX    = /^[A-Za-z0-9\s.-]*$/;
// Company Name: letters, spaces, dot, hyphen — no numbers
const COMPANY_REGEX  = /^[A-Za-z\s.-]*$/;
// Location: letters + spaces only
const LOCATION_REGEX = /^[A-Za-z\s]*$/;
// Working Hours: numbers, letters (AM/PM), colon, dot, hyphen, spaces e.g. "10.00 AM - 6.00pm"
const HOURS_REGEX    = /^[0-9A-Za-z:.\s-]*$/;
// Salary Package: numbers, letters (LPA), hyphen, spaces e.g. "6-7 LPA", "25000 - 40000"
const SALARY_REGEX   = /^[0-9A-Za-z\s-]*$/;
// Contact: either a 10-digit phone number OR an email address
const MAX_CONTACT_LEN = 100; // generous cap since emails can be long
const CONTACT_PHONE_REGEX = new RegExp(`^[0-9]{${MAX_CONTACT}}$`);
const CONTACT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Website / URL
const URL_REGEX      = /^https?:\/\/[^\s]+$/;

const sanitizeTitle    = (v) => v.replace(/[^A-Za-z0-9\s.-]/g, '').slice(0, MAX_TITLE);
const sanitizeCompany  = (v) => v.replace(/[^A-Za-z\s.-]/g, '').slice(0, MAX_COMPANY);
const sanitizeLocation = (v) => v.replace(/[^A-Za-z\s]/g, '').slice(0, MAX_LOCATION);
const sanitizeHours    = (v) => v.replace(/[^0-9A-Za-z:.\s-]/g, '');
const sanitizeSalary   = (v) => v.replace(/[^0-9A-Za-z\s-]/g, '');
// Allows digits (for a phone number), the characters emails use, plus "," and
// space so multiple contacts can be listed e.g. "name@x.com, 9677611569".
const sanitizeContact  = (v) => v.replace(/[^A-Za-z0-9@._%+,\s-]/g, '').slice(0, MAX_CONTACT_LEN);

// Validates on blur/submit only (not sanitized while typing).
const isValidUrl = (url) => URL_REGEX.test(url);

// Email check — blocks a duplicated TLD like "demo123@gmail.com.com"
// but allows legitimate multi-part TLDs like ".edu.in", ".com.au".
const isValidEmail = (email) => {
  if (!CONTACT_EMAIL_REGEX.test(email)) return false;
  const parts = (email.split('@')[1] || '').split('.');
  if (parts.length < 2) return false;
  const last = parts[parts.length - 1].toLowerCase();
  const prev = parts[parts.length - 2].toLowerCase();
  if (last === prev) return false;
  return true;
};

// A single entry is valid if it's a 10-digit phone number OR a valid email.
const isValidSingleContact = (val) => CONTACT_PHONE_REGEX.test(val) || isValidEmail(val);

// Contact field supports one or more comma-separated entries, e.g.
// "name@x.com, 9677611569" — every non-empty entry must individually be
// a valid email or a valid 10-digit number.
const isValidContact = (val) => {
  const parts = val.split(',').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length === 0) return false;
  return parts.every(isValidSingleContact);
};

// ── Field wrapper — local styles.field (own copy, matches AchievementFormScreen) ──
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

// ── Styled TextInput — local styles.styledInput (own copy, matches AchievementFormScreen) ──
// NOTE: onFocus/onBlur are pulled out of ...props and merged with the internal
// focus-state handlers, so callers can pass their own onBlur (e.g. for URL
// validation) without breaking the focus ring styling.
function StyledInput({ hasError, multiline, style, onFocus, onBlur, ...props }) {
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
      onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
      onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

// ── Chip selector (Employment Type / Work Mode) ───────────────────────────────
function ChipSelector({ label, options, value, onChange }) {
  return (
    <View style={chip.wrapper}>
      <Text style={chip.label}>{label}</Text>
      <View style={chip.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[chip.chip, value === opt && chip.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[chip.chipText, value === opt && chip.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}



// ── JobPostingFormScreen ──────────────────────────────────────────────────────
const JobPostingFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  console.log(item,"item");
  const isEdit = !!item;
  console.log(item,"edit");
  const { user } = useAuth();

  const [currentUserName, setCurrentUserName] = useState('');
  const [currentClubId, setCurrentClubId]     = useState(null);

  // Form fields
  const [jobTitle,                 setJobTitle]                 = useState(item?.jobTitle || '');
  const [companyName,              setCompanyName]              = useState(item?.companyName || '');
  const [location,                 setLocation]                 = useState(item?.location || '');
  const [employmentType,           setEmploymentType]           = useState(item?.employmentType || EMPLOYMENT_TYPES[0]);
  const [workingHours,             setWorkingHours]             = useState(item?.workingHours || '');
  const [workMode,                 setWorkMode]                 = useState(item?.workMode || WORK_MODES[0]);
  const [aboutRole,                setAboutRole]                = useState(item?.aboutRole || '');
  const [requiredSkills,           setRequiredSkills]           = useState(item?.requiredSkillsExperience || '');
  const [contactInfo,              setContactInfo]              = useState(item?.contactInfo || '');
  const [salaryPackage,            setSalaryPackage]            = useState(item?.salaryPackage || '');
  const [website,                  setWebsite]                  = useState(item?.website || '');
  const [closingDate,              setClosingDate]              = useState(
    item?.vacancyClosingDate ? new Date(item.vacancyClosingDate) : null
  );
  //const [showDate,    setShowDate]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  // Attachments
  const [attachments,         setAttachments]         = useState([]);          // new (not yet uploaded)
  const [existingAttachments, setExistingAttachments] = useState([]);          // already on server
  const [fileViewer,          setFileViewer]          = useState({ visible: false, uri: null });
const today = new Date();
const closingMinDate = new Date(today.getFullYear() - 100, 0, 1);
const closingMaxDate = new Date(today.getFullYear() + 80, 11, 31);
  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const name   = parsed.fullName || parsed.name || user?.fullName || 'Admin';
        const clubId = parsed.clubId || null;
        setCurrentUserName(name);
        setCurrentClubId(clubId);
      } catch (e) {
        console.warn('Bootstrap error:', e);
      }
    };
    bootstrap();
  }, []);

  // ── Load existing attachments in edit mode ─────────────────────────────────
  useEffect(() => {
    if (isEdit && item?.jobPostingId) loadExistingAttachments();
  }, []);

  const loadExistingAttachments = async () => {
    try {
      const res = await jobPostingService.getAttachments(item.jobPostingId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };

  // ── Attachment picker (same UX as AchievementFormScreen) ──────────────────
  const handlePickAttachment = async () => {
    const totalUsed = existingAttachments.length + attachments.length;
    const slotsLeft = 5 - totalUsed;
    if (slotsLeft <= 0) {
      Alert.alert('Limit reached', 'Max 5 attachments per job posting.');
      return;
    }

    Alert.alert('Attach File', 'Choose file type', [
      {
        text: 'PDF / Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            copyToCacheDirectory: true,
            multiple: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map((asset) => ({
              uri: asset.uri, fileName: asset.name,
              mimeType: asset.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments((prev) => [...prev, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Image',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            selectionLimit: slotsLeft,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map((asset) => ({
              uri: asset.uri,
              fileName: asset.fileName || `image_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              type: 'image',
            }));
            setAttachments((prev) => [...prev, ...picked]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const formatDate = (d) => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const e = {};
    if (!jobTitle.trim())    e.jobTitle    = 'Job Title is required.';
    else if (jobTitle.trim().length > MAX_TITLE) e.jobTitle = `Job Title must be ${MAX_TITLE} characters or fewer.`;
    else if (!TITLE_REGEX.test(jobTitle.trim())) e.jobTitle = 'Only letters, numbers, spaces, "." and "-" are allowed.';

    if (!companyName.trim()) e.companyName = 'Company Name is required.';
    else if (companyName.trim().length > MAX_COMPANY) e.companyName = `Company Name must be ${MAX_COMPANY} characters or fewer.`;
    else if (!COMPANY_REGEX.test(companyName.trim())) e.companyName = 'Only letters, spaces, "." and "-" are allowed.';

    if (!location.trim())    e.location    = 'Location is required.';
    else if (location.trim().length > MAX_LOCATION) e.location = `Location must be ${MAX_LOCATION} characters or fewer.`;
    else if (!LOCATION_REGEX.test(location.trim())) e.location = 'Only letters and spaces are allowed.';

    if (!contactInfo.trim()) {
      e.contactInfo = 'Contact info is required.';
    } else if (!isValidContact(contactInfo.trim())) {
      e.contactInfo = `Each entry must be a valid ${MAX_CONTACT}-digit contact number or a valid email address.`;
    }

    if (website.trim() && !isValidUrl(website.trim())) {
      e.website = 'Enter a valid URL starting with http:// or https://';
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const payload = {
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        location: location.trim(),
        employmentType,
        workingHours: workingHours.trim(),
        workMode,
        aboutRole: aboutRole.trim(),
        requiredSkillsExperience: requiredSkills.trim(),
        contactInfo: contactInfo.trim(),
        salaryPackage: salaryPackage.trim(),
        website: website.trim(),
        vacancyClosingDate: formatDate(closingDate),
      };

      let res;
      let recordId;

      if (isEdit) {
        res      = await jobPostingService.update(item.jobPostingId, { ...payload, modifiedBy: currentUserName });
        recordId = item.jobPostingId;
      } else {
        res      = await jobPostingService.create({
          ...payload,
          clubId: Number(currentClubId),
          createdBy: currentUserName,
        });
        recordId = res?.data?.jobPostingId ?? res?.data?.JobPostingId;
      }

      if (!res?.success) {
        Alert.alert('Error', getSafeErrorMessage(res));
        return;
      }

      // Upload new attachments one-by-one (same as AchievementFormScreen)
      for (const file of attachments) {
        try {
          const fd = new FormData();
          fd.append('files', { uri: file.uri, name: file.fileName, type: file.mimeType });
          await jobPostingService.uploadAttachments(recordId, fd);
        } catch (e) {
          console.warn('Attachment upload failed:', e.message);
        }
      }

      Alert.alert('Success', isEdit ? 'Job posting updated!' : 'Job posting added!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const totalAttachments = existingAttachments.length + attachments.length;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      <GradientHeader style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEdit ? 'Edit Job Posting' : 'Add Job Posting'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Job Title ── */}
        <Field label="Job Title" required error={errors.jobTitle} charCount={jobTitle.length} maxChars={MAX_TITLE}>
          <StyledInput
            placeholder="Enter Job Title"
            value={jobTitle}
            maxLength={MAX_TITLE}
            onChangeText={(t) => {
              const clean = sanitizeTitle(t);
              setJobTitle(clean);
              if (errors.jobTitle) setErrors(p => ({ ...p, jobTitle: '' }));
            }}
            hasError={!!errors.jobTitle}
          />
        </Field>

        {/* ── Company Name ── */}
        <Field label="Company Name" required error={errors.companyName} charCount={companyName.length} maxChars={MAX_COMPANY}>
          <StyledInput
            placeholder="Enter Company Name"
            value={companyName}
            maxLength={MAX_COMPANY}
            onChangeText={(t) => {
              const clean = sanitizeCompany(t);
              setCompanyName(clean);
              if (errors.companyName) setErrors(p => ({ ...p, companyName: '' }));
            }}
            hasError={!!errors.companyName}
          />
        </Field>

        {/* ── Location ── */}
        <Field label="Location" required error={errors.location} charCount={location.length} maxChars={MAX_LOCATION}>
          <StyledInput
            placeholder="Enter Location"
            value={location}
            maxLength={MAX_LOCATION}
            onChangeText={(t) => {
              const clean = sanitizeLocation(t);
              setLocation(clean);
              if (errors.location) setErrors(p => ({ ...p, location: '' }));
            }}
            hasError={!!errors.location}
          />
        </Field>

        <ChipSelector label="Employment Type *" options={EMPLOYMENT_TYPES}
          value={employmentType} onChange={setEmploymentType} />

        {/* ── Working Hours ── */}
        <Field label="Working Hours" hint="e.g. 10.00 AM - 6.00 PM">
          <StyledInput
            placeholder="e.g. 10.00 AM - 6.00pm"
            value={workingHours}
            onChangeText={(t) => setWorkingHours(sanitizeHours(t))}
          />
        </Field>

        <ChipSelector label="Work Mode *" options={WORK_MODES}
          value={workMode} onChange={setWorkMode} />

        {/* ── About the Role ── */}
        <Field label="About the Role" charCount={aboutRole.length} maxChars={MAX_ABOUT}>
          <StyledInput
            placeholder="Describe the role"
            value={aboutRole}
            maxLength={MAX_ABOUT}
            onChangeText={(t) => setAboutRole(t.slice(0, MAX_ABOUT))}
            multiline
          />
        </Field>

        {/* ── Required Skills & Experience ── */}
        <Field label="Required Skills & Experience" charCount={requiredSkills.length} maxChars={MAX_SKILLS}>
          <StyledInput
            placeholder="List required skills and experience"
            value={requiredSkills}
            maxLength={MAX_SKILLS}
            onChangeText={(t) => setRequiredSkills(t.slice(0, MAX_SKILLS))}
            multiline
          />
        </Field>

        {/* ── Salary Package ── */}
        <Field label="Salary Package" hint="e.g. 6-7 LPA or 25000 - 40000">
          <StyledInput
            placeholder="e.g. 6-7 LPA"
            value={salaryPackage}
            onChangeText={(t) => setSalaryPackage(sanitizeSalary(t))}
          />
        </Field>

        {/* ── Contact Info (number and/or email, comma-separated) ── */}
        <Field label="If Interested, Please Contact" required error={errors.contactInfo} hint={`e.g. name@example.com, ${'9'.repeat(MAX_CONTACT)}`}>
          <StyledInput
            placeholder="Email and/or phone number"
            value={contactInfo}
            maxLength={MAX_CONTACT_LEN}
            onChangeText={(t) => {
              const clean = sanitizeContact(t);
              setContactInfo(clean);
              if (errors.contactInfo) setErrors(p => ({ ...p, contactInfo: '' }));
            }}
            onBlur={() => {
              const val = contactInfo.trim();
              if (val && !isValidContact(val)) {
                setErrors(p => ({ ...p, contactInfo: `Each entry must be a valid ${MAX_CONTACT}-digit contact number or a valid email address.` }));
              }
            }}
            hasError={!!errors.contactInfo}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        {/* ── Vacancy Closing Date — same dd/mm/yyyy typing + wheel-list picker used in AchievementFormScreen ── */}
<DOBField
  label="Vacancy Closing Date"
  required
  value={closingDate}
  minDate={closingMinDate}
  maxDate={closingMaxDate}
  error={errors.closingDate}
  FieldComponent={Field}
  InputComponent={StyledInput}
  onChange={(d) => {
    setClosingDate(d);
    if (errors.closingDate) setErrors(p => ({ ...p, closingDate: '' }));
  }}
/>
        {/* ── Website (new field, right after Vacancy Closing Date) ── */}
        <Field label="Website" error={errors.website} hint="e.g. https://www.example.com">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StyledInput
              style={{ flex: 1 }}
              placeholder="https://www.example.com"
              value={website}
              onChangeText={(t) => {
                setWebsite(t);
                if (errors.website) setErrors(p => ({ ...p, website: '' }));
              }}
              onBlur={() => {
                const val = website.trim();
                if (val && !isValidUrl(val)) {
                  setErrors(p => ({ ...p, website: 'Enter a valid URL starting with http:// or https://' }));
                }
              }}
              hasError={!!errors.website}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {!!website.trim() && (
              <TouchableOpacity
                onPress={() => {
                  const val = website.trim();
                  if (isValidUrl(val)) {
                    Linking.openURL(val);
                  } else {
                    Alert.alert('Invalid URL', 'Please enter a valid website URL (starting with http:// or https://) before opening.');
                  }
                }}
                style={{ marginLeft: 8, padding: 10 }}
                accessibilityLabel="Open website"
              >
                <MaterialCommunityIcons name="open-in-new" size={20} color={NAVY} />
              </TouchableOpacity>
            )}
          </View>
        </Field>

        {/* ── Attachments (same grid as AchievementFormScreen — unchanged) ── */}
        <Text style={styles.attachLabel}>ATTACHMENTS</Text>
        <View style={styles.attachGrid}>
          {existingAttachments.map((a) => {
            const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
              a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
            const url = toPublicUrl(a.filePath);
            return (
              <View key={`ex-${a.attachmentId}`} style={styles.gridThumb}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                  if (isImage) setFileViewer({ visible: true, uri: url });
                  else Linking.openURL(url);
                }}>
                  {isImage ? (
                    <Image source={{ uri: url }} style={styles.gridImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.gridDoc}>
                      <Text style={styles.gridDocIcon}>📄</Text>
                      <Text style={styles.gridDocName} numberOfLines={2}>{a.fileName}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridRemove} onPress={() => {
                  Alert.alert('Delete', `Delete "${a.fileName}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                          await jobPostingService.deleteAttachment(a.attachmentId);
                          setExistingAttachments((prev) => prev.filter((x) => x.attachmentId !== a.attachmentId));
                        } catch { Alert.alert('Error', 'Failed to delete attachment.'); }
                      },
                    },
                  ]);
                }}>
                  <Text style={styles.gridRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {attachments.map((a, i) => (
            <View key={`new-${i}`} style={styles.gridThumb}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                if (a.type === 'image') setFileViewer({ visible: true, uri: a.uri });
                else Linking.openURL(a.uri);
              }}>
                {a.type === 'image' ? (
                  <Image source={{ uri: a.uri }} style={styles.gridImg} resizeMode="cover" />
                ) : (
                  <View style={styles.gridDoc}>
                    <Text style={styles.gridDocIcon}>📄</Text>
                    <Text style={styles.gridDocName} numberOfLines={2}>{a.fileName}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridRemove}
                onPress={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                <Text style={styles.gridRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {totalAttachments < 5 && (
            <TouchableOpacity style={styles.gridAddBtn} onPress={handlePickAttachment} activeOpacity={0.8}>
              <Text style={styles.gridAddIcon}>📷</Text>
              <Text style={styles.gridAddText}>Add ({totalAttachments}/5)</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.attachHint}>JPG, PNG, PDF, Word · Max 50 MB each</Text>

        {/* ── Save button ── 
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave} disabled={loading} activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>{isEdit ? 'Update Job Posting' : 'Post Job'}</Text>
            </>
          )}
        </TouchableOpacity>*/}
      </ScrollView>

      {/* ── Image viewer modal ── */}
      <Modal visible={fileViewer.visible} transparent animationType="fade"
        onRequestClose={() => setFileViewer({ visible: false, uri: null })}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose}
            onPress={() => setFileViewer({ visible: false, uri: null })}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {fileViewer.uri && (
            <Image source={{ uri: fileViewer.uri }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
};



export default JobPostingFormScreen;