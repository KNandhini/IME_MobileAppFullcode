import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { magazineService } from '../services/magazineService';

import api from '../utils/api';
import { MagazineFormScreenStyles as styles } from './screenStyles';

const NAVY = '#1E3A5F';
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

const MagazineFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title || '');
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
  if (!title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }

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
      Alert.alert('Error', res?.message || 'Failed to save magazine.');
      return;
    }

    Alert.alert('Success', isEdit ? 'Magazine updated!' : 'Magazine added!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]);
  } catch (e) {
    Alert.alert('Error', e.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};
const totalAttachments = existingAttachments.length + attachments.length;
  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Magazine' : 'Add Magazine'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        <TextInput
          label="Magazine Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
        />

        <TextInput
          label="Issue Number"
          value={issueNumber}
          onChangeText={setIssueNumber}
          mode="outlined"
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
          placeholder="e.g. Vol. 12, Issue 4"
        />

        <TextInput
          label="Author Name"
          value={authorName}
          onChangeText={setAuthorName}
          mode="outlined"
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
        />

        <TextInput
          label="Category"
          value={category}
          onChangeText={setCategory}
          mode="outlined"
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
          placeholder="e.g. Engineering, Newsletter"
        />

        <TouchableOpacity style={styles.dateField} onPress={() => setShowDate(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="calendar-outline" size={20} color={NAVY} />
          <View style={styles.dateText}>
            <Text style={styles.dateLabelText}>Published Date</Text>
            <Text style={styles.dateValue}>
              {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
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
      <Text style={styles.gridAddIcon}>📎</Text>
      <Text style={styles.gridAddText}>Add ({totalAttachments}/5)</Text>
    </TouchableOpacity>
  )}
</View>
        <Text style={styles.attachHint}>PDF, JPG, PNG, Word · Max 50 MB each</Text>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave} disabled={loading} activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Magazine</Text>
              </>
          }
        </TouchableOpacity>

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