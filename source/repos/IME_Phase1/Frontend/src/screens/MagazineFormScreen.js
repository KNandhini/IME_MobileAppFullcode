import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { magazineService } from '../services/magazineService';

import api from '../utils/api';
import { MagazineFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = '#2b3139';
const GOLD = '#D4A017';

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

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
  const [date, setDate] = useState(item?.publishedDate ? new Date(item.publishedDate) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });

  // ── Load existing attachments (edit mode) ──────────────────────────────
  useEffect(() => {
    if (isEdit && item?.magazineId) loadExistingAttachments();
  }, []);

  const loadExistingAttachments = async () => {
    try {
      debugger;
      const res = await magazineService.getAttachments(item.magazineId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };

  const handlePickAttachment = async () => {
  const totalUsed = existingAttachments.length + attachments.length;
  const slotsLeft = 5 - totalUsed;
  if (slotsLeft <= 0) { Alert.alert('Limit reached', 'Max 5 attachments per magazine.'); return; }
    Alert.alert('Attach File', 'Choose file type', [
      {
        text: 'PDF / Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            copyToCacheDirectory: true, multiple: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map(asset => ({
              uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments(prev => [...prev, ...picked]);
          }
        },
      },
      {
        text: 'Cover Image',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: slotsLeft, quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map(asset => ({
              uri: asset.uri, fileName: asset.fileName || `image_${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg', type: 'image',
            }));
            setAttachments(prev => [...prev, ...picked]);
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
  if (!title.trim()) e.title = 'Title is required.';
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
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEdit ? 'Edit Magazine' : 'Add Magazine'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        <Field label="Magazine Title" required error={errors.title}>
          <StyledInput
            placeholder="Enter magazine title"
            value={title}
            onChangeText={(t) => { setTitle(t); if (errors.title) setErrors(p => ({ ...p, title: null })); }}
            hasError={!!errors.title}
          />
        </Field>

        <Field label="Description">
          <StyledInput
            placeholder="Enter description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </Field>

        <Field label="Issue Number">
          <StyledInput
            placeholder="e.g. Vol. 12, Issue 4"
            value={issueNumber}
            onChangeText={setIssueNumber}
          />
        </Field>

        <Field label="Author Name">
          <StyledInput
            placeholder="Enter author name"
            value={authorName}
            onChangeText={setAuthorName}
          />
        </Field>

        <Field label="Category">
          <StyledInput
            placeholder="e.g. Engineering, Newsletter"
            value={category}
            onChangeText={setCategory}
          />
        </Field>

        {/* ── Date picker — styled like Title/Category, matches Achievement Form ── */}
        <Field label="Published Date">
          <TouchableOpacity
            style={styles.styledInput.base}
            onPress={() => setShowDate(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, color: '#1E293B', fontWeight: '500' }}>
                {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <MaterialCommunityIcons name="calendar-outline" size={18} color={NAVY} />
            </View>
          </TouchableOpacity>
        </Field>
        {showDate && (
          <DateTimePicker
            value={date} mode="date" display="default" maximumDate={new Date()}
            onChange={(evt, d) => { setShowDate(false); if (d) setDate(d); }}
          />
        )}

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