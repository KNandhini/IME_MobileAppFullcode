import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { magazineService } from '../services/magazineService';
import DOBField from '../components/DOBField';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../utils/api';
import { MagazineFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = '#2b3139';
const GOLD = COLORS.accent;

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};
// Field max lengths
const MAX_TITLE       = 150;
const MAX_DESCRIPTION = 500;
const MAX_ISSUE_NO    = 50;   // adjust if you need a different cap
const MAX_AUTHOR      = 150;

// Title: letters, numbers, spaces — free text but capped, no special char restriction
// (if you DO want to restrict title like Job Title, use TITLE_REGEX below)
const TITLE_REGEX = /^[A-Za-z0-9\s.-]*$/; // permissive, blocks stray junk chars

// Description: fully free text, no character restriction — only length capped

// Issue Number: letters, numbers, spaces, dot, comma, hyphen (e.g. "Issue-12", "Vol. 3, No. 4")
const ISSUE_NO_REGEX = /^[A-Za-z0-9\s.,-]*$/;

// Author Name: letters, numbers, spaces, dot, hyphen (e.g. "Dr. A.K. Sharma-Rao")
const AUTHOR_REGEX = /^[A-Za-z0-9\s.-]*$/;

const sanitizeTitle = (v) =>
  v.replace(/[^A-Za-z0-9\s.,'"!?()&-]/g, '').slice(0, MAX_TITLE);

const sanitizeDescription = (v) => v.slice(0, MAX_DESCRIPTION); // free text, only length capped

const sanitizeIssueNo = (v) =>
  v.replace(/[^A-Za-z0-9\s.,-]/g, '').slice(0, MAX_ISSUE_NO);

const sanitizeAuthor = (v) =>
  v.replace(/[^A-Za-z0-9\s.-]/g, '').slice(0, MAX_AUTHOR);

// ── Field wrapper — local styles.field (matches Achievement Form Screen) ──
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

// ── Styled TextInput — local styles.styledInput (matches Achievement Form Screen) ──
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

const MagazineFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title || '');
  const [errors, setErrors] = useState({});
  const [description, setDescription] = useState(item?.description || '');
  const [issueNumber, setIssueNumber] = useState(item?.issueNumber || '');
  const [authorName, setAuthorName] = useState(item?.authorName || '');
  const [category, setCategory] = useState(item?.category || '');
  const [date, setDate] = useState(item?.publishedDate ? new Date(item.publishedDate) : null);
  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });
const today = new Date();
const minDate = new Date(today.getFullYear() - 100, 0, 1);
const maxDate = new Date(today.getFullYear() + 80, 11, 31);
  // ── Load existing attachments (edit mode) ──────────────────────────────
  useEffect(() => {
    if (isEdit && item?.magazineId) loadExistingAttachments();
  }, []);

  const loadExistingAttachments = async () => {
    try {
      const res = await magazineService.getAttachments(item.magazineId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };
// Attachment size cap — matches the "Max 50 MB each" hint shown to the user.
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // 50 MB

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
// real size against MAX_ATTACHMENT_BYTES.
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
 const handlePickAttachment = async () => {
  const totalUsed = existingAttachments.length + attachments.length;
  const slotsLeft = 5 - totalUsed;
  if (slotsLeft <= 0) {
    Alert.alert('Limit reached', 'Max 5 attachments per magazine.');
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
          // ✅ Check size before slicing to slots
          const { accepted, rejected } = await partitionBySize(result.assets);
          warnIfRejected(rejected);

          const picked = accepted.slice(0, slotsLeft).map((asset) => ({
            uri: asset.uri, fileName: asset.name,
            mimeType: asset.mimeType || 'application/pdf', type: 'document',
          }));
          setAttachments((prev) => [...prev, ...picked]);

          if (accepted.length > slotsLeft) {
            Alert.alert('Limit applied', `Only ${slotsLeft} file(s) added. Max 5 total.`);
          }
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
          // ✅ Check size before slicing to slots
          const { accepted, rejected } = await partitionBySize(result.assets);
          warnIfRejected(rejected);

          const picked = accepted.slice(0, slotsLeft).map((asset) => ({
            uri: asset.uri,
            fileName: asset.fileName || `image_${Date.now()}.jpg`,
            mimeType: asset.mimeType || 'image/jpeg',
            type: 'image',
          }));
          setAttachments((prev) => [...prev, ...picked]);

          if (accepted.length > slotsLeft) {
            Alert.alert('Limit applied', `Only ${slotsLeft} file(s) added. Max 5 total.`);
          }
        }
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
};

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSave = async () => {
  const e = {};

  if (!title.trim()) {
    e.title = 'Title is required.';
  } else if (title.trim().length > MAX_TITLE) {
    e.title = `Title must be ${MAX_TITLE} characters or fewer.`;
  } else if (!TITLE_REGEX.test(title.trim())) {
    e.title = 'Title contains invalid characters.';
  }

  if (description.trim().length > MAX_DESCRIPTION) {
    e.description = `Description must be ${MAX_DESCRIPTION} characters or fewer.`;
  }

  if (issueNumber.trim() && !ISSUE_NO_REGEX.test(issueNumber.trim())) {
    e.issueNumber = 'Only letters, numbers, spaces, "." "," and "-" are allowed.';
  } else if (issueNumber.trim().length > MAX_ISSUE_NO) {
    e.issueNumber = `Issue Number must be ${MAX_ISSUE_NO} characters or fewer.`;
  }

  if (!date) {
    e.publishedDate = 'Published Date is required.';
  }

  if (!authorName.trim()) {
    e.authorName = 'Author Name is required.';
  } else if (authorName.trim().length > MAX_AUTHOR) {
    e.authorName = `Author Name must be ${MAX_AUTHOR} characters or fewer.`;
  } else if (!AUTHOR_REGEX.test(authorName.trim())) {
    e.authorName = 'Only letters, numbers, "." and "-" are allowed.';
  }

  setErrors(e);
  if (Object.keys(e).length > 0) return;

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('Title', title.trim());
    formData.append('Description', description.trim());
    formData.append('IssueNumber', issueNumber.trim());
    formData.append('PublishedDate', formatDate(date));
    formData.append('AuthorName', authorName.trim());
    formData.append('Category', category.trim());

    attachments.forEach((file) => {
      formData.append('Files', { uri: file.uri, name: file.fileName, type: file.mimeType });
    });

    const res = isEdit
      ? await magazineService.updateWithMedia(item.magazineId, formData)
      : await magazineService.createWithMedia(formData);

    if (!res?.success) {
      Alert.alert('Error', getSafeErrorMessage(res));
      return;
    }

    Alert.alert('Success', isEdit ? 'Magazine updated!' : 'Magazine added!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
        <Text style={styles.navTitle}>{isEdit ? 'Edit Magazine' : 'Add Magazine'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </GradientHeader>
 <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

       {/* ── Title ── */}
<Field label="Title" required error={errors.title} charCount={title.length} maxChars={MAX_TITLE}>
  <StyledInput
    placeholder="Enter Magazine Title"
    value={title}
    maxLength={MAX_TITLE}
    onChangeText={(t) => {
      const clean = sanitizeTitle(t);
      setTitle(clean);
      if (errors.title) setErrors(p => ({ ...p, title: '' }));
    }}
    hasError={!!errors.title}
  />
</Field>

{/* ── Description ── */}
<Field label="Description" error={errors.description} charCount={description.length} maxChars={MAX_DESCRIPTION}>
  <StyledInput
    placeholder="Enter Description"
    value={description}
    maxLength={MAX_DESCRIPTION}
    onChangeText={(t) => {
      setDescription(sanitizeDescription(t));
      if (errors.description) setErrors(p => ({ ...p, description: '' }));
    }}
    multiline
    hasError={!!errors.description}
  />
</Field>

{/* ── Issue Number ── */}
<Field label="Issue Number" error={errors.issueNumber} hint="e.g. Vol. 3, No. 12-2026">
  <StyledInput
    placeholder="e.g. Issue-12"
    value={issueNumber}
    maxLength={MAX_ISSUE_NO}
    onChangeText={(t) => {
      const clean = sanitizeIssueNo(t);
      setIssueNumber(clean);
      if (errors.issueNumber) setErrors(p => ({ ...p, issueNumber: '' }));
    }}
    hasError={!!errors.issueNumber}
  />
</Field>

{/* ── Author Name ── */}
<Field label="Author Name" required error={errors.authorName} charCount={authorName.length} maxChars={MAX_AUTHOR}>
  <StyledInput
    placeholder="Enter Author Name"
    value={authorName}
    maxLength={MAX_AUTHOR}
    onChangeText={(t) => {
      const clean = sanitizeAuthor(t);
      setAuthorName(clean);
      if (errors.authorName) setErrors(p => ({ ...p, authorName: '' }));
    }}
    hasError={!!errors.authorName}
  />
</Field>

        <Field label="Category">
          <StyledInput
            placeholder="e.g. Engineering, Newsletter"
            value={category}
            onChangeText={setCategory}
          />
        </Field>

        {/* ── Published Date — type dd/mm/yyyy or tap 📅 for the wheel-list picker ── */}
        <DOBField
  label="Published Date"
  required
  value={date}
  onChange={(d) => {
    setDate(d);
    if (errors.publishedDate) setErrors(p => ({ ...p, publishedDate: '' }));
  }}
  minDate={minDate}
  maxDate={maxDate}
  error={errors.publishedDate}
  FieldComponent={Field}
  InputComponent={StyledInput}
/>

       <Text style={styles.attachLabel}>ATTACHMENTS (PDF, IMAGE, DOC)</Text>
<View style={styles.attachGrid}>
  {existingAttachments.map((a) => {
    const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                    a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
    return (
      <View key={`ex-${a.attachmentId}`} style={styles.gridThumb}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => {
          if (isImage) setFileViewer({ visible: true, uri: toPublicUrl(a.filePath) });
          else Linking.openURL(toPublicUrl(a.filePath));
        }}>
          {isImage ? (
            <Image source={{ uri: toPublicUrl(a.filePath) }} style={styles.gridImg} resizeMode="cover" />
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
            { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                await magazineService.deleteAttachment(a.attachmentId);
                setExistingAttachments(prev => prev.filter(x => x.attachmentId !== a.attachmentId));
              } catch { Alert.alert('Error', 'Failed to delete'); }
            }},
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
        onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
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
        <Text style={styles.attachHint}>PDF, JPG, PNG, Word · Max 50 MB each</Text>

       

      </ScrollView>
</KeyboardAvoidingView>
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



export default MagazineFormScreen;