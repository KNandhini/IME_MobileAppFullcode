import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Alert,
  ActivityIndicator, Image, Modal, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import { healthNutritionService } from '../services/healthNutritionService';
import { getSafeErrorMessage } from '../utils/errorHandler';
import { HealthNutritionFormScreenStyles as styles } from './screenStyles';

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

// Client-side attachment size cap. Mirrors the backend limit so users get
// instant feedback instead of waiting on a failed upload. This is a UX
// convenience only — the backend must enforce the real limit, since some
// pickers/platforms don't always report a file size.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const isFileTooLarge = (sizeInBytes, fileName) => {
  if (typeof sizeInBytes === 'number' && sizeInBytes > MAX_FILE_SIZE_BYTES) {
    Alert.alert(
      'File too large',
      `"${fileName}" is ${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB. Please choose a file under 50 MB.`
    );
    return true;
  }
  return false;
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, children, error, hint }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>
        {label}{required && <Text style={styles.fieldReq}> *</Text>}
      </Text>
      {children}
      {!!hint && !error && <Text style={styles.fieldHint}>{hint}</Text>}
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Styled TextInput ──────────────────────────────────────────────────────────
function StyledInput({ hasError, multiline, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.inputBase,
        multiline && styles.inputMultiline,
        focused && styles.inputFocused,
        hasError && styles.inputErrored,
        style,
      ]}
      placeholderTextColor={COLORS.placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

// ── HealthNutritionFormScreen ─────────────────────────────────────────────────
const HealthNutritionFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [postedUser, setPostedUser] = useState(item?.postedUser || '');
  const [postedBy, setPostedBy] = useState(item?.postedBy ? new Date(item.postedBy) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [status, setStatus] = useState(item?.status ?? true);

  const [attachment, setAttachment] = useState(null); // { uri, fileName, mimeType, type }
  const [existingAttachmentUrl] = useState(item?.attachmentPath || null);
  const [existingAttachmentName] = useState(item?.attachmentFileName || null);
  const [existingAttachmentType] = useState(item?.attachmentType || null);
  // True once the user has explicitly cleared the existing (server-side) attachment.
  // Only meaningful in edit mode; lets them remove it and optionally pick a new one.
  const [removeExisting, setRemoveExisting] = useState(false);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Resolved attachment currently shown in the UI: a newly-picked file takes
  // priority; otherwise fall back to the existing one unless it's been removed.
  const attachmentPreviewName = attachment?.fileName || (!removeExisting ? existingAttachmentName : null);
  const attachmentPreviewType = attachment?.type || (!removeExisting ? existingAttachmentType : null);
  const attachmentPreviewUri = attachment?.uri || (!removeExisting ? existingAttachmentUrl : null);

  // Matches the backend's AllowedAttachmentTypes whitelist exactly, split
  // into the categories the requirements ask for (Document / Audio / Video /
  // Photo / Other) so the picked file always lands in the single
  // `attachment` field the existing module already supports end-to-end.
  const handlePickAttachment = async () => {
    Alert.alert('Attach File', 'Choose attachment type', [
      {
        text: '📄 Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain',
              'text/csv',
            ],
            copyToCacheDirectory: true,
            multiple: false,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const a = result.assets[0];
            if (isFileTooLarge(a.size, a.name)) return;
            setAttachment({ uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'application/pdf', type: 'document' });
            setRemoveExisting(false);
          }
        },
      },
      {
        text: '🎵 Audio',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
            multiple: false,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const a = result.assets[0];
            if (isFileTooLarge(a.size, a.name)) return;
            setAttachment({ uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'audio/mpeg', type: 'audio' });
            setRemoveExisting(false);
          }
        },
      },
      {
        text: '🎬 Video',
        onPress: async () => {
          const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permStatus !== 'granted') {
            Alert.alert('Permission needed', 'Allow access to your media library.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsMultipleSelection: false,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const a = result.assets[0];
            const fileName = a.fileName || `video_${Date.now()}.mp4`;
            if (isFileTooLarge(a.fileSize, fileName)) return;
            setAttachment({ uri: a.uri, fileName, mimeType: a.mimeType || 'video/mp4', type: 'video' });
            setRemoveExisting(false);
          }
        },
      },
      {
        text: '🖼️ Photo',
        onPress: async () => {
          const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permStatus !== 'granted') {
            Alert.alert('Permission needed', 'Allow access to your photo library.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const a = result.assets[0];
            const fileName = a.fileName || `photo_${Date.now()}.jpg`;
            if (isFileTooLarge(a.fileSize, fileName)) return;
            setAttachment({ uri: a.uri, fileName, mimeType: a.mimeType || 'image/jpeg', type: 'image' });
            setRemoveExisting(false);
          }
        },
      },
      {
        text: '📎 Other File',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
            multiple: false,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const a = result.assets[0];
            if (isFileTooLarge(a.size, a.name)) return;
            setAttachment({ uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'application/octet-stream', type: 'other' });
            setRemoveExisting(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Clears whichever attachment is currently on screen — a newly-picked file,
  // or (in edit mode) the existing server-side one. After this, the "Add File"
  // button lets the user pick a replacement if they want one.
  const handleRemoveAttachment = () => {
    if (attachment) {
      setAttachment(null);
    } else if (existingAttachmentUrl) {
      setRemoveExisting(true);
    }
    setErrors((p) => ({ ...p, attachment: '' }));
  };

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!postedUser.trim()) e.postedUser = 'Posted user is required';
    if (!postedBy) e.postedBy = 'Posted date is required';
    // Required whenever there's no attachment resolved for save — covers
    // fresh create, and edit where the existing file was removed and never replaced.
    if (!attachmentPreviewUri) e.attachment = 'An attachment is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('Title', title.trim());
      form.append('Description', description.trim());
      form.append('PostedUser', postedUser.trim());
      form.append('PostedBy', formatDate(postedBy));
      form.append('Status', status ? 'true' : 'false');

      if (attachment) {
        form.append('Attachment', {
          uri: attachment.uri,
          name: attachment.fileName,
          type: attachment.mimeType,
        });
      } else if (isEdit && removeExisting) {
        // Existing attachment was cleared and nothing new was picked to replace it.
        // Flag it so the backend drops the old file instead of leaving it unchanged.
        form.append('RemoveAttachment', 'true');
      }

      const res = isEdit
        ? await healthNutritionService.update(item.id, form)
        : await healthNutritionService.create(form);

      if (res?.success) {
        Alert.alert('Success', isEdit ? 'Post updated successfully' : 'Post created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', getSafeErrorMessage(res) || res?.message || 'Something went wrong.');
      }
    } catch (e) {
      console.error('HealthNutrition save error:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addBtnLabel = attachmentPreviewUri ? 'Replace' : 'Add File';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      <GradientHeader style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSideBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{isEdit ? 'Edit Post' : 'New Podcast'}</Text>
        </View>
        <View style={styles.navSideBtn} />
      </GradientHeader>

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          <Field label="Title" required error={errors.title}>
            <StyledInput
              placeholder="Enter title"
              value={title}
              onChangeText={(t) => { setTitle(t); setErrors((p) => ({ ...p, title: '' })); }}
              hasError={!!errors.title}
            />
          </Field>

          <Field label="Description" required error={errors.description}>
            <StyledInput
              placeholder="Enter description"
              value={description}
              onChangeText={(t) => { setDescription(t); setErrors((p) => ({ ...p, description: '' })); }}
              hasError={!!errors.description}
              multiline
            />
          </Field>

          <Field label="Posted User" required error={errors.postedUser} hint="Name shown as the author">
            <StyledInput
              placeholder="Enter posted user's name"
              value={postedUser}
              onChangeText={(t) => { setPostedUser(t); setErrors((p) => ({ ...p, postedUser: '' })); }}
              hasError={!!errors.postedUser}
            />
          </Field>

          <Field label="Posted Date" required error={errors.postedBy}>
            <TouchableOpacity
              style={[styles.inputBase, !!errors.postedBy && styles.inputErrored]}
              onPress={() => setShowDate(true)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 15, color: COLORS.dark, fontWeight: '500' }}>
                  {postedBy.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={NAVY} />
              </View>
            </TouchableOpacity>
          </Field>
          {showDate && (
            <DateTimePicker
              value={postedBy}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(evt, d) => {
                setShowDate(false);
                if (evt.type === 'set' && d) {
                  setPostedBy(d);
                  setErrors((p) => ({ ...p, postedBy: '' }));
                }
              }}
            />
          )}

          {/* ── Attachment (single) ── */}
          <Text style={styles.attachLabel}>ATTACHMENT{!isEdit && <Text style={styles.fieldReq}> *</Text>}</Text>
          <View style={styles.attachGrid}>
            {attachmentPreviewUri ? (
              <View style={styles.gridThumb}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (attachmentPreviewType === 'image') setFileViewer({ visible: true, uri: attachmentPreviewUri });
                    else Linking.openURL(attachmentPreviewUri);
                  }}
                >
                  {attachmentPreviewType === 'image' ? (
                    <Image source={{ uri: attachmentPreviewUri }} style={styles.gridImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.gridDoc}>
                      <Text style={styles.gridDocIcon}>
                        {{ video: '🎬', audio: '🎵', document: '📄', other: '📎' }[attachmentPreviewType] || '📄'}
                      </Text>
                      <Text style={styles.gridDocName} numberOfLines={2}>{attachmentPreviewName}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {/* Removes whatever is shown — new pick or existing file — regardless of mode */}
                <TouchableOpacity
                  style={styles.gridRemove}
                  onPress={handleRemoveAttachment}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.gridRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {(!attachmentPreviewUri || isEdit) && (
              <TouchableOpacity style={styles.gridAddBtn} onPress={handlePickAttachment} activeOpacity={0.8}>
                <Text style={styles.gridAddIcon}>📷</Text>
                <Text style={styles.gridAddText}>{addBtnLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
          {!!errors.attachment && <Text style={styles.fieldError}>{errors.attachment}</Text>}
          <Text style={styles.attachHint}>
            {isEdit
              ? 'Leave as-is to keep the current file, remove it with ✕, or pick a new one to replace it.'
              : 'PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT/CSV, MP3/WAV, MP4/AVI/MOV/MKV, JPG/PNG/GIF/WEBP, ZIP/RAR/7Z · Max 50 MB'}
          </Text>

          {/* ── Status toggle ── */}
          <Field label="Status">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.statusPill, status && styles.statusPillActive]}
                onPress={() => setStatus(true)}
              >
                <Text style={[styles.statusPillText, status && styles.statusPillTextActive]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusPill, !status && styles.statusPillActiveInactive]}
                onPress={() => setStatus(false)}
              >
                <Text style={[styles.statusPillText, !status && styles.statusPillTextActive]}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </Field>

          {/* ── Save button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Post' : 'Save Post'}</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={fileViewer.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setFileViewer({ visible: false, uri: null })}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setFileViewer({ visible: false, uri: null })}>
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

export default HealthNutritionFormScreen;