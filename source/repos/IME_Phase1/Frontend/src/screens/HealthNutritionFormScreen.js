import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Alert,
  ActivityIndicator, Image, Modal, Linking, TextInput, StyleSheet, Platform,
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

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

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
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
            setAttachment({ uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'application/pdf', type: 'document' });
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
            setAttachment({ uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'audio/mpeg', type: 'audio' });
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
            setAttachment({ uri: a.uri, fileName: a.fileName || `video_${Date.now()}.mp4`, mimeType: a.mimeType || 'video/mp4', type: 'video' });
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
            setAttachment({ uri: a.uri, fileName: a.fileName || `photo_${Date.now()}.jpg`, mimeType: a.mimeType || 'image/jpeg', type: 'image' });
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
            setAttachment({ uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'application/octet-stream', type: 'other' });
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

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!description.trim()) e.description = 'Description is required';
    if (!postedUser.trim()) e.postedUser = 'Posted user is required';
    if (!postedBy) e.postedBy = 'Posted date is required';
    if (!isEdit && !attachment) e.attachment = 'An attachment is required';
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

  const attachmentPreviewName = attachment?.fileName || existingAttachmentName;
  const attachmentPreviewType = attachment?.type || existingAttachmentType;
  const attachmentPreviewUri = attachment?.uri || existingAttachmentUrl;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      <GradientHeader style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSideBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{isEdit ? 'Edit Post' : 'New Health & Nutrition Post'}</Text>
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
                <TouchableOpacity
                  style={styles.gridRemove}
                  onPress={() => setAttachment(attachment ? null : null)}
                >
                  {/* Only allow clearing a newly-picked file, not the existing one on edit */}
                  {attachment && (
                    <Text style={styles.gridRemoveText} onPress={() => setAttachment(null)}>✕</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {(!attachmentPreviewUri || isEdit) && (
              <TouchableOpacity style={styles.gridAddBtn} onPress={handlePickAttachment} activeOpacity={0.8}>
                <Text style={styles.gridAddIcon}>📷</Text>
                <Text style={styles.gridAddText}>{isEdit ? 'Replace' : 'Add File'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {!!errors.attachment && <Text style={styles.fieldError}>{errors.attachment}</Text>}
          <Text style={styles.attachHint}>
            {isEdit ? 'Leave as-is to keep the current file, or pick a new one to replace it.' : 'PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT/CSV, MP3/WAV, MP4/AVI/MOV/MKV, JPG/PNG/GIF/WEBP, ZIP/RAR/7Z · Max 50 MB'}
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

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12,
    paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + 12,
  },
  navSideBtn: { minWidth: 40, paddingHorizontal: 4, paddingVertical: 4 },
  navCenter: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },

  body: { padding: 20, paddingBottom: 60 },

  fieldWrapper: { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldReq: { color: COLORS.danger },
  fieldHint: { fontSize: 11, color: '#94A3B8', marginTop: 5 },
  fieldError: { fontSize: 11, color: COLORS.danger, marginTop: 5, fontWeight: '500' },

  inputBase: {
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0', fontWeight: '500',
  },
  inputMultiline: { height: 120, paddingTop: 14 },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: '#fff' },
  inputErrored: { borderColor: COLORS.danger, backgroundColor: '#FFF5F5' },

  attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  attachGrid: {
    flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1',
    borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 96, alignItems: 'center',
  },
  gridThumb: { width: 96, height: 96, borderRadius: 10, margin: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  gridImg: { width: '100%', height: '100%' },
  gridDoc: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },
  gridDocIcon: { fontSize: 26 },
  gridDocName: { fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 4 },
  gridRemove: { position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 9, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  gridRemoveText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  gridAddBtn: { width: 96, height: 96, borderRadius: 10, margin: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  gridAddIcon: { fontSize: 24, marginBottom: 4 },
  gridAddText: { fontSize: 10, color: '#64748B', textAlign: 'center', fontWeight: '500' },
  attachHint: { fontSize: 11, color: '#94A3B8', marginTop: 6, marginBottom: 18 },

  statusPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  statusPillActive: { backgroundColor: '#EEF9F0', borderColor: COLORS.success },
  statusPillActiveInactive: { backgroundColor: '#FEF2F2', borderColor: COLORS.danger },
  statusPillText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  statusPillTextActive: { color: '#1E293B' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: NAVY, borderRadius: 14, paddingVertical: 16, marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerClose: { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default HealthNutritionFormScreen;