import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Image, Modal, Linking, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { circularService } from '../services/circularService';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { AddCircularScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

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
  { value: 'Public(All Clubs)', label: 'Public', sub: 'All Clubs' },
  { value: 'Private(This Club Only)', label: 'Private', sub: 'This Club Only' },
];

const AddCircularScreen = ({ route, navigation }) => {
  const editData = route.params?.item;
  if (editData) {
    console.log('Edit Data:', editData);
  }
  const [title, setTitle] = useState(editData?.title || '');
  const [description, setDescription] = useState(editData?.description || '');
  const [circularNumber, setCircularNumber] = useState(editData?.circularNumber || '');
  // const [visibility,     setVisibility]     = useState(editData?.visibility     || 'All');
  const [publishDate, setPublishDate] = useState(
    editData?.publishDate ? new Date(editData.publishDate) : new Date()
  );
  const [visibility, setVisibility] = useState(editData?.visibility || 'Public(All Clubs)');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });
  const [errors, setErrors] = useState({});
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

  // Letters, numbers, spaces, and . , - only
  const TITLE_REGEX = /^[A-Za-z0-9\s.,-]*$/;
  const CIRCULAR_NUMBER_REGEX = /^[0-9]*$/;
  const TITLE_MAX_LENGTH = 150;
  const DESCRIPTION_MAX_LENGTH = 500;

  const saveCircular = async () => {
    if (saving) return;
    const validationErrors = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      validationErrors.title = 'Title is required';
    } else if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      validationErrors.title = `Title cannot exceed ${TITLE_MAX_LENGTH} characters`;
    } else if (!TITLE_REGEX.test(trimmedTitle)) {
      validationErrors.title = 'Title can only contain letters, numbers, spaces, and . , -';
    }

    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      validationErrors.description = `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters`;
    }

    if (circularNumber.trim() && !CIRCULAR_NUMBER_REGEX.test(circularNumber.trim())) {
      validationErrors.circularNumber = 'Circular number can only contain numbers';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }
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
            style={styles.input}
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            onChangeText={(text) => {
              // Only allow letters, numbers, spaces, and . , -
              const filtered = text.replace(/[^A-Za-z0-9\s.,-]/g, '');
              setTitle(filtered);

              setErrors(prev => ({
                ...prev,
                title: '',
              }));
            }}
            placeholder="Enter title"
            placeholderTextColor="#CBD5E1"
          />

          {errors.title ? (
            <Text style={styles.error}>{errors.title}</Text>
          ) : null}
          <Text style={{ color: "#94A3B8", fontSize: 12, alignSelf: "flex-end", marginTop: 4 }}>{title.length}/{TITLE_MAX_LENGTH}</Text>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
            value={description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChangeText={(text) => {
              setDescription(text);
              setErrors(prev => ({ ...prev, description: '' }));
            }}
            multiline placeholder="Enter description" placeholderTextColor="#CBD5E1"
          />
          {errors.description ? (
            <Text style={styles.error}>{errors.description}</Text>
          ) : null}
          <Text style={{ color: "#94A3B8", fontSize: 12, alignSelf: "flex-end", marginTop: 4 }}>{description.length}/{DESCRIPTION_MAX_LENGTH}</Text>

          <Text style={styles.label}>Circular Number</Text>
          <TextInput
            style={styles.input}
            value={circularNumber}
            keyboardType="number-pad"
            onChangeText={(text) => {
              // Only allow digits
              const filtered = text.replace(/[^0-9]/g, '');
              setCircularNumber(filtered);
              setErrors(prev => ({ ...prev, circularNumber: '' }));
            }}
            placeholder="e.g. 2024001"
            placeholderTextColor="#CBD5E1"
          />
          {errors.circularNumber ? (
            <Text style={styles.error}>{errors.circularNumber}</Text>
          ) : null}

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