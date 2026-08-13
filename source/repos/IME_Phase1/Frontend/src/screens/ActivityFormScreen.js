import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Linking,
  TextInput,
} from 'react-native';
import { Card, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activityService } from '../services/activityService';
import { BASE_URL } from '../utils/api';
import { ActivityFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import DOBField from '../components/DOBField';

// ─────────────────────────────────────────────────────────────────────────
// ── Validation & Sanitization Helpers ──────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────

// Field max lengths
const MAX_ACTIVITY_NAME = 200;
const MAX_DESCRIPTION   = 500;
const MAX_VENUE         = 100;
const MAX_COORDINATOR   = 150;
const MAX_CHIEF_GUEST   = 150;

// Attachment size cap — matches the "Max 50 MB each" hint shown to the user.
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // 50 MB

// Activity Name: letters, numbers, spaces, dot, comma, hyphen
const ACTIVITY_NAME_REGEX = /^[A-Za-z0-9\s.,-]*$/;

// Venue: letters, numbers, spaces, dot, comma, hyphen
const VENUE_REGEX = /^[A-Za-z0-9\s.,-]*$/;

// Time: digits, letters (AM/PM), colon, dot, hyphen, spaces
// e.g. "10.00 AM - 11.00 PM", "10 am - 11pm"
const TIME_REGEX = /^[0-9A-Za-z:.\s-]*$/;

// Coordinator / Chief Guest: letters, spaces, dot, hyphen (names — no numbers)
const NAME_REGEX = /^[A-Za-z\s.-]*$/;

const sanitizeActivityName = (v) =>
  v.replace(/[^A-Za-z0-9\s.,-]/g, '').slice(0, MAX_ACTIVITY_NAME);

const sanitizeDescription = (v) => v.slice(0, MAX_DESCRIPTION); // free text, only length capped

const sanitizeVenue = (v) =>
  v.replace(/[^A-Za-z0-9\s.,-]/g, '').slice(0, MAX_VENUE);

const sanitizeTime = (v) =>
  v.replace(/[^0-9A-Za-z:.\s-]/g, '');

const sanitizeCoordinator = (v) =>
  v.replace(/[^A-Za-z\s.-]/g, '').slice(0, MAX_COORDINATOR);

const sanitizeChiefGuest = (v) =>
  v.replace(/[^A-Za-z\s.-]/g, '').slice(0, MAX_CHIEF_GUEST);

// ─── Build a displayable URL from a stored FilePath ───────────────────────
const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return `${BASE_URL}/Uploads/${filePath.replace(/\\/g, '/').replace(/^Uploads\/?/i, '')}`;
};

// Decide how to render an attachment based on its FileType/FileName.
const getAttachmentKind = (fileTypeOrName = "") => {
  const v = fileTypeOrName.toLowerCase();
  if (v.includes("image") || /\.(jpg|jpeg|png|gif|webp)$/.test(v)) return "image";
  if (v.includes("video") || /\.(mp4|mov|avi|mkv)$/.test(v)) return "video";
  return "document";
};

const formatMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Resolve a picked asset's size in bytes, whichever field the picker
// happened to populate (DocumentPicker uses `size`, ImagePicker usually
// gives `fileSize`, but neither is guaranteed on every platform/version —
// fall back to asking the filesystem directly for the real size).
const getAssetSize = async (asset) => {
  if (typeof asset.size === 'number') return asset.size;
  if (typeof asset.fileSize === 'number') return asset.fileSize;
  try {
    const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
    if (info?.exists && typeof info.size === 'number') return info.size;
  } catch (e) {
    console.warn('Could not determine file size for', asset?.uri, e);
  }
  return null; // unknown — let it through rather than block a valid pick
};

// Splits picked assets into { accepted, rejected }, checking each one's
// real size against MAX_ATTACHMENT_BYTES (async, since size may need a
// filesystem lookup rather than being present on the asset already).
const partitionBySize = async (assets) => {
  const accepted = [];
  const rejected = [];
  for (const asset of assets) {
    const size = await getAssetSize(asset);
    if (size != null && size > MAX_ATTACHMENT_BYTES) {
      rejected.push({ name: asset.fileName || asset.name || 'file', size });
    } else {
      accepted.push(asset);
    }
  }
  return { accepted, rejected };
};

const warnIfRejected = (rejected) => {
  if (rejected.length === 0) return;
  const list = rejected.map(r => `• ${r.name} (${formatMB(r.size)})`).join('\n');
  Alert.alert(
    'File too large',
    `The following file${rejected.length > 1 ? 's' : ''} exceed${rejected.length > 1 ? '' : 's'} the 50 MB limit and ${rejected.length > 1 ? 'were' : 'was'} not added:\n\n${list}`
  );
};

const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const VISIBILITY_OPTIONS = [
  { value: 'Public(All Clubs)', label: 'Public', sub: 'All Clubs' },
  { value: 'Private(This Club Only)', label: 'Private', sub: 'This Club Only' },
];

// Local date-only string — avoids the UTC-shift-by-one-day bug that
// `.toISOString()` causes for date-only fields like ActivityDate.
const toDateOnlyString = (date) => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00`;
};

// ── Field wrapper ──────────────────────────────────────────────────────────
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

// ── Styled TextInput ───────────────────────────────────────────────────────
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

const ActivityFormScreen = ({ route, navigation }) => {
  const { activityId } = route.params || {};
  const isEditMode = !!activityId;

  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const [formData, setFormData] = useState({
    activityName: '',
    description: '',
    venue: '',
    coordinator: '',
    chiefGuest: '',
    time: '',
    status: 'Upcoming',
    visibility: 'Public(All Clubs)',
  });
  const [activityDate, setActivityDate] = useState(null);
  const [errors, setErrors] = useState({});
  const [registrationDeadline, setRegistrationDeadline] = useState(null);

  // Bounds for both date pickers below — wide enough to cover past and
  // future-scheduled activities. Picker still defaults to *today* when
  // no value has been picked yet (see DOBField's defaultDate behavior).
  const today = new Date();
  const activityMinDate = new Date(today.getFullYear() - 100, 0, 1);
  const activityMaxDate = new Date(today.getFullYear() + 80, 11, 31);

  useEffect(() => {
    if (isEditMode) {
      loadActivity();
      loadAttachments();
    }
  }, [activityId]);

  // ── Delete an existing (server-side) attachment ───────────────────────────
  const deleteExisting = (attachmentId, fileName) => {
    Alert.alert('Delete', `Delete "${fileName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await activityService.deleteAttachment(attachmentId);
            setExistingAttachments(p => p.filter(a => a.attachmentId !== attachmentId));
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  // ── Load existing attachments ─────────────────────────────────────────────
  const loadAttachments = async () => {
    try {
      const res = await activityService.getAttachments(activityId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };

  const loadActivity = async () => {
    try {
      const res = await activityService.getById(activityId);
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          activityName: d.activityName || '',
          description: d.description || '',
          venue: d.venue || '',
          coordinator: d.coordinator || '',
          chiefGuest: d.chiefGuest || '',
          time: d.time || '',
          status: d.status || 'Upcoming',
          visibility: d.visibility || 'Public(All Clubs)',
        });
        if (d.activityDate) setActivityDate(new Date(d.activityDate));
        if (d.registrationDeadline) setRegistrationDeadline(new Date(d.registrationDeadline));
      }
    } catch (e) {
      console.error('Load activity error:', e);
    }
  };

  const update = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((p) => (p[field] ? { ...p, [field]: null } : p));
  };

  const handlePickAttachment = async () => {
    const totalCount = existingAttachments.length + attachments.length;
    if (totalCount >= 5) { Alert.alert('Limit reached', 'Max 5 attachments.'); return; }
    const slots = 5 - totalCount;

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
            const { accepted, rejected } = await partitionBySize(result.assets);
            warnIfRejected(rejected);
            const picked = accepted.slice(0, slots).map(a => ({
              uri: a.uri,
              fileName: a.name,
              mimeType: a.mimeType || 'application/pdf',
              type: 'document',
            }));
            setAttachments(p => [...p, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Video',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo library access.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            selectionLimit: slots,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            // Videos in particular can easily blow past 50MB, so every
            // picked asset (image or video) gets checked before it's added.
            const { accepted, rejected } = await partitionBySize(result.assets);
            warnIfRejected(rejected);
            const picked = accepted.slice(0, slots).map(a => ({
              uri: a.uri,
              fileName: a.fileName || `media_${Date.now()}`,
              mimeType: a.mimeType || (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
              type: a.type === 'video' ? 'video' : 'image',
            }));
            setAttachments(p => [...p, ...picked]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openFile = (uri, type) => {
    if (type === 'image') return;
    Linking.openURL(uri).catch(() => Alert.alert('Error', 'Cannot open this file.'));
  };

  // ── Upload new attachments via multipart fetch ────────────────────────────
  const uploadAttachments = async (id) => {
    if (attachments.length === 0) return;

    const formDataBody = new FormData();
    attachments.forEach(file => {
      formDataBody.append("files", {
        uri: Platform.OS === "android"
          ? file.uri
          : file.uri.replace("file://", ""),
        name: file.fileName,
        type: file.mimeType,
      });
    });

    const token = await AsyncStorage.getItem("authToken");

    const response = await fetch(
      `${BASE_URL}/api/Activity/${id}/attachments`,
      {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formDataBody,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    return response.json().catch(() => ({}));
  };

  const handleSave = async () => {
    const e = {};

    if (!formData.activityName.trim()) {
      e.activityName = 'Title is required.';
    } else if (formData.activityName.trim().length > MAX_ACTIVITY_NAME) {
      e.activityName = `Title must be ${MAX_ACTIVITY_NAME} characters or fewer.`;
    } else if (!ACTIVITY_NAME_REGEX.test(formData.activityName.trim())) {
      e.activityName = 'Only letters, numbers, spaces, "." "," and "-" are allowed.';
    }

    if (!formData.description.trim()) {
      e.description = 'Description is required.';
    } else if (formData.description.trim().length > MAX_DESCRIPTION) {
      e.description = `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
    }

    if (!formData.venue.trim()) {
      e.venue = 'Venue is required.';
    } else if (formData.venue.trim().length > MAX_VENUE) {
      e.venue = `Venue must be ${MAX_VENUE} characters or fewer.`;
    } else if (!VENUE_REGEX.test(formData.venue.trim())) {
      e.venue = 'Only letters, numbers, spaces, "." "," and "-" are allowed.';
    }

    if (formData.time.trim() && !TIME_REGEX.test(formData.time.trim())) {
      e.time = 'Only numbers, letters, ":" "." and "-" are allowed (e.g. 10.00 AM - 11.00 PM).';
    }

    if (formData.coordinator.trim().length > MAX_COORDINATOR) {
      e.coordinator = `Coordinator must be ${MAX_COORDINATOR} characters or fewer.`;
    } else if (formData.coordinator.trim() && !NAME_REGEX.test(formData.coordinator.trim())) {
      e.coordinator = 'Only letters, spaces, "." and "-" are allowed.';
    }

    if (formData.chiefGuest.trim().length > MAX_CHIEF_GUEST) {
      e.chiefGuest = `Chief Guest must be ${MAX_CHIEF_GUEST} characters or fewer.`;
    } else if (formData.chiefGuest.trim() && !NAME_REGEX.test(formData.chiefGuest.trim())) {
      e.chiefGuest = 'Only letters, spaces, "." and "-" are allowed.';
    }

    if (!activityDate) e.activityDate = 'Activity date is required.';

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        activityName: formData.activityName.trim(),
        description: formData.description.trim(),
        venue: formData.venue.trim(),
        time: formData.time.trim(),
        chiefGuest: formData.chiefGuest.trim(),
        coordinator: formData.coordinator.trim(),
        status: formData.status,
        visibility: formData.visibility,
        activityDate: toDateOnlyString(activityDate),
        registrationDeadline: toDateOnlyString(registrationDeadline),
      };

      const res = isEditMode
        ? await activityService.update(activityId, payload)
        : await activityService.create(payload);

      if (!res.success) {
        Alert.alert('Error', getSafeErrorMessage(res));
        setSaving(false);
        return;
      }

      const newActivityId = isEditMode
        ? activityId
        : (res.data?.activityId ?? res.data?.id ?? res.data);

      if (attachments.length > 0 && newActivityId) {
        try {
          await uploadAttachments(newActivityId);
        } catch (uploadErr) {
          console.warn('Attachment upload error:', uploadErr?.message ?? uploadErr);
          Alert.alert(
            'Partial Success',
            (isEditMode ? 'Activity updated' : 'Activity created') +
            ', but some attachments failed to upload.\nYou can retry from the edit screen.'
          );
          setSaving(false);
          navigation.goBack();
          return;
        }
      }

      Alert.alert('Success', isEditMode ? 'Activity updated.' : 'Activity created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
  <View style={styles.root}>
    {/* ── Top navbar ── */}
    <GradientHeader style={styles.navbar}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.navSide}
        disabled={saving}
      >
        <Text style={styles.navCancel}>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.navTitle}>{isEditMode ? 'Edit Activity' : 'Add Activity'}</Text>
      <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={saving}>
        {saving
          ? <ActivityIndicator size="small" color={COLORS.accent} />
          : <Text style={styles.navSave}>{isEditMode ? 'Update' : 'Save'}</Text>}
      </TouchableOpacity>
    </GradientHeader>

    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Activity Details ── */}
        <Field
          label="Title"
          required
          error={errors.activityName}
          charCount={formData.activityName.length}
          maxChars={MAX_ACTIVITY_NAME}
        >
          <StyledInput
            placeholder="Enter activity title"
            value={formData.activityName}
            maxLength={MAX_ACTIVITY_NAME}
            onChangeText={(v) => update('activityName', sanitizeActivityName(v))}
            hasError={!!errors.activityName}
            returnKeyType="next"
          />
        </Field>

        <Field
          label="Description"
          required
          error={errors.description}
          charCount={formData.description.length}
          maxChars={MAX_DESCRIPTION}
        >
          <StyledInput
            placeholder="Describe the activity…"
            value={formData.description}
            maxLength={MAX_DESCRIPTION}
            onChangeText={(v) => update('description', sanitizeDescription(v))}
            hasError={!!errors.description}
            multiline
          />
        </Field>

        <Field
          label="Venue"
          required
          error={errors.venue}
          charCount={formData.venue.length}
          maxChars={MAX_VENUE}
        >
          <StyledInput
            placeholder="Enter venue"
            value={formData.venue}
            maxLength={MAX_VENUE}
            onChangeText={(v) => update('venue', sanitizeVenue(v))}
            hasError={!!errors.venue}
            returnKeyType="next"
          />
        </Field>

        <Field
          label="Coordinator"
          error={errors.coordinator}
          charCount={formData.coordinator.length}
          maxChars={MAX_COORDINATOR}
        >
          <StyledInput
            placeholder="Enter coordinator name"
            value={formData.coordinator}
            maxLength={MAX_COORDINATOR}
            onChangeText={(v) => update('coordinator', sanitizeCoordinator(v))}
            hasError={!!errors.coordinator}
            returnKeyType="next"
          />
        </Field>

        <Field
          label="Chief Guest"
          error={errors.chiefGuest}
          charCount={formData.chiefGuest.length}
          maxChars={MAX_CHIEF_GUEST}
        >
          <StyledInput
            placeholder="Enter chief guest name"
            value={formData.chiefGuest}
            maxLength={MAX_CHIEF_GUEST}
            onChangeText={(v) => update('chiefGuest', sanitizeChiefGuest(v))}
            hasError={!!errors.chiefGuest}
            returnKeyType="next"
          />
        </Field>

        <Field
          label="Time"
          error={errors.time}
          hint="e.g. 10.00 AM - 11.00 PM or 10 am - 11pm"
        >
          <StyledInput
            placeholder="e.g. 10:00 AM - 11:00 PM"
            value={formData.time}
            onChangeText={(v) => update('time', sanitizeTime(v))}
            hasError={!!errors.time}
            returnKeyType="done"
          />
        </Field>

        {/* ── Date & Time ── */}
        <DOBField
          label="Activity Date"
          required
          value={activityDate}
          minDate={activityMinDate}
          maxDate={activityMaxDate}
          error={errors.activityDate}
          FieldComponent={Field}
          InputComponent={StyledInput}
          onChange={(d) => {
            setActivityDate(d);
            if (errors.activityDate) setErrors(p => ({ ...p, activityDate: null }));
          }}
        />

        <DOBField
          label="Registration Deadline"
          value={registrationDeadline}
          minDate={activityMinDate}
          maxDate={activityMaxDate}
          FieldComponent={Field}
          InputComponent={StyledInput}
          onChange={setRegistrationDeadline}
        />

        {/* ── Status ── */}
        <Text style={styles.sectionTitle}>Status</Text>
     <View style={styles.statusRow}>
  {STATUSES.map((s) => (
    <TouchableOpacity key={s} onPress={() => update('status', s)}>
      <Chip
        selected={formData.status === s}
        style={[styles.chip, formData.status === s && styles.chipSelected]}
        textStyle={[
          styles.chipText,
          formData.status === s && styles.chipTextSelected,
        ]}
        selectedColor={formData.status === s ? '#FFFFFF' : undefined}
      >
        {s}
      </Chip>
    </TouchableOpacity>
  ))}
</View>

        {/* ── Visibility ── */}
        <Text style={styles.sectionTitle}>Visibility</Text>
        <View style={styles.radioGroup}>
          {VISIBILITY_OPTIONS.map((opt) => {
            const selected = formData.visibility === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.radioOption, selected && styles.radioOptionSelected]}
                onPress={() => update('visibility', opt.value)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioTextWrap}>
                  <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.radioSub, selected && styles.radioSubSelected]}>
                    {opt.sub}
                  </Text>
                </View>
                <Text style={styles.radioIcon}>
                  {opt.value === 'Public(All Clubs)' ? '🌐' : '🔒'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Attachments ── */}
        <Text style={styles.sectionTitle}>Attachments (Optional)</Text>
        <View style={styles.attachGrid}>

          {/* Existing (server) attachments */}
          {existingAttachments.map((a) => {
            const kind = getAttachmentKind(a.fileType || a.fileName);
            const url = buildFileUrl(a.filePath);
            return (
              <View key={`ex-${a.attachmentId}`} style={styles.thumb}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (kind !== 'image') {
                      Linking.openURL(url).catch(() =>
                        Alert.alert('Error', 'Cannot open this file.')
                      );
                    }
                  }}
                >
                  {kind === 'image' ? (
                    <Image
                      source={{ uri: url }}
                      style={styles.thumbImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbDoc}>
                      <Text style={styles.thumbIcon}>
                        {kind === 'video' ? '🎬' : '📄'}
                      </Text>
                      <Text style={styles.thumbName} numberOfLines={2}>
                        {a.fileName}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.thumbRemove}
                  onPress={() => deleteExisting(a.attachmentId, a.fileName)}
                >
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* New, not-yet-uploaded attachments */}
          {attachments.map((a, i) => (
            <View key={`new-${i}`} style={styles.thumb}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => openFile(a.uri, a.type)}
              >
                {a.type === 'image' ? (
                  <Image
                    source={{ uri: a.uri }}
                    style={styles.thumbImg}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.thumbDoc}>
                    <Text style={styles.thumbIcon}>
                      {a.type === 'video' ? '🎬' : '📄'}
                    </Text>
                    <Text style={styles.thumbName} numberOfLines={2}>
                      {a.fileName}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => setAttachments(p => p.filter((_, idx) => idx !== i))}
              >
                <Text style={styles.thumbRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {(existingAttachments.length + attachments.length) < 5 && (
            <TouchableOpacity
              style={styles.thumbAdd}
              onPress={handlePickAttachment}
              activeOpacity={0.8}
            >
              <Text style={styles.thumbAddIcon}>📷</Text>
              <Text style={styles.thumbAddText}>
                Add ({existingAttachments.length + attachments.length}/5)
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.attachHint}>JPG, PNG, PDF, DOC, MP4 · Max 50 MB each</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  </View>
);
};

export default ActivityFormScreen;