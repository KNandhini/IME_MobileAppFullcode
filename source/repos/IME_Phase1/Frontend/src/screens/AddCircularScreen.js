import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Image, Modal, Linking, ActivityIndicator, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { circularService } from '../services/circularService';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

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
  { value: 'Public(All Clubs)',  label: 'Public',  sub: 'All Clubs' },
  { value: 'Private(This Club Only)', label: 'Private', sub: 'This Club Only' },
];

const AddCircularScreen = ({ route, navigation }) => {
  const editData = route.params?.item;
console.log(editData,"editData");
  const [title,          setTitle]          = useState(editData?.title          || '');
  const [description,    setDescription]    = useState(editData?.description    || '');
  const [circularNumber, setCircularNumber] = useState(editData?.circularNumber || '');
 // const [visibility,     setVisibility]     = useState(editData?.visibility     || 'All');
  const [publishDate,    setPublishDate]    = useState(
    editData?.publishDate ? new Date(editData.publishDate) : new Date()
  );
  const [visibility,          setVisibility]          = useState(editData?.visibility || 'Public(All Clubs)');
  const [showPicker,          setShowPicker]          = useState(false);
  const [saving,              setSaving]              = useState(false);
  const [attachments,         setAttachments]         = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer,          setFileViewer]          = useState({ visible: false, uri: null });

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
        if (res.data?.visibility) setVisibility(res.data.visibility);
      }
    } catch (e) {
      console.error('Load attachments error:', e);
    }
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
            type: ['application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            copyToCacheDirectory: true,
            multiple: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slots).map(a => ({
              uri: a.uri, fileName: a.name,
              mimeType: a.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments(p => [...p, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Video',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
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
          } catch { Alert.alert('Error', 'Failed to delete.'); }
        },
      },
    ]);
  };

  const saveCircular = async () => {
    if (saving) return;
    if (!title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }
    try {
      setSaving(true);
      const payload = {
        title, description, circularNumber,
        publishDate: formatDate(publishDate),
        visibility,
      };
      const response = editData
        ? await circularService.update(editData.circularId, payload, attachments)
        : await circularService.create(payload, attachments);

      if (response?.success) {
        Alert.alert('Success', editData ? 'Updated successfully.' : 'Created successfully.');
        navigation.goBack();
      } else {
        Alert.alert('Error', response?.message || 'Failed to save.');
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
    <SafeAreaView style={styles.safe}>

      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{editData ? 'Edit Circular' : 'New Circular'}</Text>
        <TouchableOpacity onPress={saveCircular} style={styles.navSide} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.saveText}>{editData ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input} value={title} onChangeText={setTitle}
            placeholder="Enter title" placeholderTextColor="#CBD5E1"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
            value={description} onChangeText={setDescription}
            multiline placeholder="Enter description" placeholderTextColor="#CBD5E1"
          />

          <Text style={styles.label}>Circular Number</Text>
          <TextInput
            style={styles.input} value={circularNumber} onChangeText={setCircularNumber}
            placeholder="e.g. GO-2024-001" placeholderTextColor="#CBD5E1"
          />

          <Text style={styles.label}>Publish Date</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
            <Text style={{ color: '#1E293B', fontSize: 15 }}>
              {publishDate
                ? new Date(publishDate).toLocaleDateString('en-IN')
                : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={publishDate instanceof Date ? publishDate : new Date()}
              mode="date"
              display="default"
              onChange={(event, selected) => {
                setShowPicker(false);
                if (selected) setPublishDate(selected);
              }}
            />
          )}

          {/* ── Visibility ── */}
          <Text style={styles.label}>Visibility</Text>
          <View style={styles.radioGroup}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const selected = visibility === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.radioOption, selected && styles.radioOptionSelected]}
                  onPress={() => setVisibility(opt.value)}
                  activeOpacity={0.8}
                >
                  {/* Radio circle */}
                  <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>

                  {/* Text */}
                  <View style={styles.radioTextWrap}>
                    <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.radioSub, selected && styles.radioSubSelected]}>
                      {opt.sub}
                    </Text>
                  </View>

                  {/* Icon */}
                  <Text style={styles.radioIcon}>
                    {opt.value === 'public' ? '🌐' : '🔒'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Attachments */}
          <Text style={styles.label}>Attachments</Text>
          <View style={styles.attachGrid}>

            {existingAttachments.map((a) => {
              const uri = a.filePath;
              const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                              a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
              return (
                <View key={`ex-${a.attachmentId}`} style={styles.thumb}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openFile(uri, isImage ? 'image' : 'file')}>
                    {isImage ? (
                      <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbDoc}>
                        <Text style={styles.thumbIcon}>📄</Text>
                        <Text style={styles.thumbName} numberOfLines={2}>{a.fileName}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.thumbRemove} onPress={() => deleteExisting(a.attachmentId, a.fileName)}>
                    <Text style={styles.thumbRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {attachments.map((a, i) => (
              <View key={`new-${i}`} style={styles.thumb}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => openFile(a.uri, a.type)}>
                  {a.type === 'image' ? (
                    <Image source={{ uri: a.uri }} style={styles.thumbImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.thumbDoc}>
                      <Text style={styles.thumbIcon}>{a.type === 'video' ? '🎬' : '📄'}</Text>
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

    </SafeAreaView>
  );
};

export default AddCircularScreen;

const styles = StyleSheet.create({
  safe        : { flex: 1, backgroundColor: NAVY },
  navbar      : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: NAVY },
  navSide     : { minWidth: 64, paddingHorizontal: 4 },
  navTitle    : { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  cancelText  : { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  saveText    : { fontSize: 15, color: GOLD, fontWeight: '700', textAlign: 'right' },
  scroll        : { flex: 1, backgroundColor: '#FAFBFC' },
  scrollContent : { padding: 20, paddingBottom: 52 },
  label : { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, marginTop: 16 },
  input : { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B', borderWidth: 1.5, borderColor: '#E2E8F0' },

  // ── Visibility Radio Buttons ──
  radioGroup: { gap: 10 },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  radioOptionSelected: {
    borderColor: NAVY,
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: NAVY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: NAVY,
  },
  radioTextWrap       : { flex: 1 },
  radioLabel          : { fontSize: 15, fontWeight: '600', color: '#374151' },
  radioLabelSelected  : { color: NAVY },
  radioSub            : { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  radioSubSelected    : { color: '#6B9CC7' },
  radioIcon           : { fontSize: 20, marginLeft: 8 },

  attachGrid     : { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80, alignItems: 'center', marginTop: 4 },
  thumb          : { width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  thumbImg       : { width: '100%', height: '100%' },
  thumbDoc       : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  thumbIcon      : { fontSize: 24 },
  thumbName      : { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
  thumbRemove    : { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  thumbRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  thumbAdd       : { width: 80, height: 80, borderRadius: 10, margin: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  thumbAddIcon   : { fontSize: 22, marginBottom: 2 },
  thumbAddText   : { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
  attachHint     : { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  viewerOverlay  : { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  viewerImage    : { width: '100%', height: '80%' },
  viewerClose    : { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});