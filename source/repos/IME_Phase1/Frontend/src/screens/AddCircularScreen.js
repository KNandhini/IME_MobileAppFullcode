import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Linking,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { circularService } from '../services/circularService';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { AddCircularScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import DOBField from '../components/DOBField';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

// ─────────────────────────────────────────────────────────────────────────
// ── Validation & Sanitization Helpers (same pattern as ActivityFormScreen) ─
// ─────────────────────────────────────────────────────────────────────────

const MAX_TITLE           = 150;
const MAX_DESCRIPTION     = 500;
const MAX_CIRCULAR_NUMBER = 20;

// Title: letters, numbers, spaces, dot, comma, hyphen
const TITLE_REGEX = /^[A-Za-z0-9\s.,-]*$/;

// Circular Number: digits only
const CIRCULAR_NUMBER_REGEX = /^[0-9]*$/;

const sanitizeTitle = (v) =>
  v.replace(/[^A-Za-z0-9\s.,-]/g, '').slice(0, MAX_TITLE);

const sanitizeDescription = (v) => v.slice(0, MAX_DESCRIPTION); // free text, only length capped

const sanitizeCircularNumber = (v) =>
  v.replace(/[^0-9]/g, '').slice(0, MAX_CIRCULAR_NUMBER);

// api.defaults.baseURL is usually something like "http://host:port/api"
// strip the trailing "/api" so we get the plain server root to prefix
// the raw disk-style paths ("Uploads\circulars\xyz.jpg") that come back
// from the backend. Same helper as AchievementDetailScreen for consistency.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const VISIBILITY_OPTIONS = [
  { value: 'Public(All Clubs)', label: 'Public', sub: 'All Clubs' },
  { value: 'Private(This Club Only)', label: 'Private', sub: 'This Club Only' },
];

// ── Field wrapper (identical contract to ActivityFormScreen) ──────────────
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

// ── Styled TextInput (identical contract to ActivityFormScreen) ───────────
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

const AddCircularScreen = ({ route, navigation }) => {
  const editData = route.params?.item;
  const isEditMode = !!editData;

  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });

  const [formData, setFormData] = useState({
    title: editData?.title || '',
    description: editData?.description || '',
    circularNumber: editData?.circularNumber || '',
    visibility: editData?.visibility || 'Public(All Clubs)',
  });
  const [publishDate, setPublishDate] = useState(
    editData?.publishDate ? new Date(editData.publishDate) : null
  );
  const [errors, setErrors] = useState({});

  // Bounds for the publish date picker — wide range since circulars can be
  // backdated or scheduled ahead.
  const today = new Date();
  const publishMinDate = new Date(today.getFullYear() - 100, 0, 1);
  const publishMaxDate = new Date(today.getFullYear() + 80, 11, 31);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (editData) loadExisting();
  }, [editData]);

  const loadExisting = async () => {
    try {
      const res = await circularService.getById(editData.circularId);
      if (res?.success) {
        const raw = res.data?.attachments || [];
        const mapped = raw.map((a) => ({
          ...a,
          filePath: a.filePath
            ? toPublicUrl(a.filePath)
            : circularService.getAttachmentUrl(a.attachmentId),
        }));
        setExistingAttachments(mapped);
        if (res.data?.visibility) update('visibility', res.data.visibility);
      }
    } catch (e) {
      console.error('Load attachments error:', e);
    }
  };

  const update = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    setErrors((p) => (p[field] ? { ...p, [field]: null } : p));
  };

  const handlePickAttachment = async () => {
    const total = existingAttachments.length + attachments.length;
    if (total >= 5) { Alert.alert('Limit reached', 'Max 5 attachments.'); return; }
    const slots = 5 - total;

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
            const picked = result.assets.slice(0, slots).map(a => ({
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
            const picked = result.assets.slice(0, slots).map(a => ({
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
    if (type === 'image') setFileViewer({ visible: true, uri });
    else Linking.openURL(uri).catch(() => Alert.alert('Error', 'Cannot open this file.'));
  };

  const deleteExisting = (attachmentId, fileName) => {
    Alert.alert('Delete', `Delete "${fileName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await circularService.deleteAttachment(attachmentId);
            setExistingAttachments(p => p.filter(a => a.attachmentId !== attachmentId));
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (saving) return;
    const e = {};

    if (!formData.title.trim()) {
      e.title = 'Title is required.';
    } else if (formData.title.trim().length > MAX_TITLE) {
      e.title = `Title must be ${MAX_TITLE} characters or fewer.`;
    } else if (!TITLE_REGEX.test(formData.title.trim())) {
      e.title = 'Only letters, numbers, spaces, "." "," and "-" are allowed.';
    }

    if (formData.description.trim().length > MAX_DESCRIPTION) {
      e.description = `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
    }

    if (formData.circularNumber.trim() && !CIRCULAR_NUMBER_REGEX.test(formData.circularNumber.trim())) {
      e.circularNumber = 'Only numbers are allowed.';
    } else if (formData.circularNumber.trim().length > MAX_CIRCULAR_NUMBER) {
      e.circularNumber = `Circular number must be ${MAX_CIRCULAR_NUMBER} digits or fewer.`;
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        circularNumber: formData.circularNumber.trim(),
        publishDate: formatDate(publishDate),
        visibility: formData.visibility,
      };

      const response = isEditMode
        ? await circularService.update(editData.circularId, payload, attachments)
        : await circularService.create(payload, attachments);

      if (response?.success) {
        Alert.alert('Success', isEditMode ? 'Updated successfully.' : 'Created successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', getSafeErrorMessage(response));
      }
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const totalAttachments = existingAttachments.length + attachments.length;

  return (
    <View style={styles.root}>

      <LinearGradient
        colors={[COLORS.headerStart, COLORS.headerEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          {/* ── Top navbar ── */}
          <GradientHeader style={styles.navbar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.navSide}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isEditMode ? 'Edit Circular' : 'New Circular'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={GOLD} />
              : <Text style={styles.saveText}>{isEditMode ? 'Update' : 'Save'}</Text>}
          </TouchableOpacity>
          </GradientHeader>
        </SafeAreaView>
      </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Circular Details ── */}
            <Field
              label="Title"
              required
              error={errors.title}
              charCount={formData.title.length}
              maxChars={MAX_TITLE}
            >
              <StyledInput
                placeholder="Enter title"
                value={formData.title}
                maxLength={MAX_TITLE}
                onChangeText={(v) => update('title', sanitizeTitle(v))}
                hasError={!!errors.title}
                returnKeyType="next"
              />
            </Field>

            <Field
              label="Description"
              error={errors.description}
              charCount={formData.description.length}
              maxChars={MAX_DESCRIPTION}
            >
              <StyledInput
                placeholder="Enter description"
                value={formData.description}
                maxLength={MAX_DESCRIPTION}
                onChangeText={(v) => update('description', sanitizeDescription(v))}
                hasError={!!errors.description}
                multiline
              />
            </Field>

            <Field
              label="Circular Number"
              error={errors.circularNumber}
              hint="e.g. 2024001"
            >
              <StyledInput
                placeholder="e.g. 2024001"
                value={formData.circularNumber}
                keyboardType="number-pad"
                maxLength={MAX_CIRCULAR_NUMBER}
                onChangeText={(v) => update('circularNumber', sanitizeCircularNumber(v))}
                hasError={!!errors.circularNumber}
                returnKeyType="done"
              />
            </Field>

            {/* ── Publish Date ── */}
            <DOBField
              label="Publish Date"
              value={publishDate}
              minDate={publishMinDate}
              maxDate={publishMaxDate}
              FieldComponent={Field}
              InputComponent={StyledInput}
              onChange={setPublishDate}
            />

            {/* ── Visibility ── */}
            <Text style={styles.label}>Visibility</Text>
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
            <Text style={styles.label}>Attachments</Text>
            <View style={styles.attachGrid}>

              {/* Existing (server) attachments */}
              {existingAttachments.map((a) => {
                const uri = a.filePath;
                const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                  a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
                return (
                  <View key={`ex-${a.attachmentId}`} style={styles.thumb}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => openFile(uri, isImage ? 'image' : 'file')}
                    >
                      {isImage ? (
                        <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.thumbDoc}>
                          <Text style={styles.thumbIcon}>📄</Text>
                          <Text style={styles.thumbName} numberOfLines={2}>{a.fileName}</Text>
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
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openFile(a.uri, a.type)}>
                    {a.type === 'image' ? (
                      <Image source={{ uri: a.uri }} style={styles.thumbImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbDoc}>
                        <Text style={styles.thumbIcon}>
                          {a.type === 'video' ? '🎬' : '📄'}
                        </Text>
                        <Text style={styles.thumbName} numberOfLines={2}>{a.fileName}</Text>
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

              {totalAttachments < 5 && (
                <TouchableOpacity style={styles.thumbAdd} onPress={handlePickAttachment} activeOpacity={0.8}>
                  <Text style={styles.thumbAddIcon}>📷</Text>
                  <Text style={styles.thumbAddText}>Add ({totalAttachments}/5)</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.attachHint}>JPG, PNG, PDF, DOC, MP4 · Max 50 MB each</Text>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* Image viewer */}
        <Modal
          visible={fileViewer.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setFileViewer({ visible: false, uri: null })}
        >
          <View style={styles.viewerOverlay}>
            <TouchableOpacity
              style={styles.viewerClose}
              onPress={() => setFileViewer({ visible: false, uri: null })}
            >
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

export default AddCircularScreen;