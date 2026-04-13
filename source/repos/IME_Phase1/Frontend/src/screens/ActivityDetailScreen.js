import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activityService } from '../services/activityService';

const getFileIcon = (fileType, fileName) => {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️';
  if (ext === 'pdf')                                   return '📄';
  if (['doc','docx'].includes(ext))                    return '📝';
  if (['xls','xlsx'].includes(ext))                    return '📊';
  if (['ppt','pptx'].includes(ext))                    return '📑';
  if (['mp4','mov','avi'].includes(ext))               return '🎬';
  if (['zip','rar'].includes(ext))                     return '🗜️';
  return '📎';
};

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const ActivityDetailScreen = ({ route }) => {
  const { activityId } = route.params;

  const [activity,    setActivity]    = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [deleting,    setDeleting]    = useState(null); // attachmentId being deleted
  const [isAdmin,     setIsAdmin]     = useState(false);

  useEffect(() => {
    init();
  }, [activityId]);

  const init = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsAdmin(user.roleName === 'Admin');
      }
      await Promise.all([loadActivity(), loadAttachments()]);
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      const res = await activityService.getById(activityId);
      if (res.success) setActivity(res.data);
    } catch (e) {
      console.error('loadActivity error:', e);
    }
  };

  const loadAttachments = useCallback(async () => {
    try {
      const res = await activityService.getAttachments(activityId);
      if (res.success) setAttachments(res.data || []);
    } catch (e) {
      console.error('loadAttachments error:', e);
    }
  }, [activityId]);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const res = await activityService.uploadAttachments(activityId, result.assets);
      if (res.success) {
        Alert.alert('Success', res.message || 'Files uploaded.');
        await loadAttachments();
      } else {
        Alert.alert('Failed', res.message || 'Upload failed.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not upload files.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (attachmentId, fileName) => {
    Alert.alert(
      'Delete Attachment',
      `Delete "${fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(attachmentId);
            try {
              const res = await activityService.deleteAttachment(attachmentId);
              if (res.success) {
                setAttachments(prev => prev.filter(a => a.attachmentId !== attachmentId));
              } else {
                Alert.alert('Error', res.message || 'Delete failed.');
              }
            } catch (e) {
              Alert.alert('Error', 'Could not delete attachment.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleOpen = async (attachmentId, fileName) => {
    const url = activityService.getAttachmentFileUrl(attachmentId);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open', `No app found to open "${fileName}".`);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open file.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Activity not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Title ── */}
      <Text style={styles.title}>{activity.activityName}</Text>

      {/* ── Info card ── */}
      <View style={styles.infoCard}>
        {activity.activityDate ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatDate(activity.activityDate)}</Text>
            </View>
          </View>
        ) : null}

        {activity.time ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏰</Text>
            <View>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{activity.time}</Text>
            </View>
          </View>
        ) : null}

        {activity.venue ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View>
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{activity.venue}</Text>
            </View>
          </View>
        ) : null}

        {activity.chiefGuest ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎤</Text>
            <View>
              <Text style={styles.infoLabel}>Chief Guest</Text>
              <Text style={styles.infoValue}>{activity.chiefGuest}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* ── Description ── */}
      {activity.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>
      ) : null}

      {/* ── Attachments ── */}
      <View style={styles.section}>
        <View style={styles.attachHeader}>
          <Text style={styles.sectionTitle}>
            Attachments {attachments.length > 0 ? `(${attachments.length})` : ''}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
              onPress={handleUpload}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.uploadBtnText}>+ Upload</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {attachments.length === 0 ? (
          <View style={styles.emptyAttach}>
            <Text style={styles.emptyAttachIcon}>📂</Text>
            <Text style={styles.emptyAttachText}>No attachments yet.</Text>
            {isAdmin && (
              <Text style={styles.emptyAttachSub}>Tap "Upload" to add files.</Text>
            )}
          </View>
        ) : (
          attachments.map((att) => (
            <View key={att.attachmentId} style={styles.attachItem}>
              <TouchableOpacity
                style={styles.attachMain}
                onPress={() => handleOpen(att.attachmentId, att.fileName)}
                activeOpacity={0.75}
              >
                <Text style={styles.attachIcon}>
                  {getFileIcon(att.fileType, att.fileName)}
                </Text>
                <View style={styles.attachMeta}>
                  <Text style={styles.attachName} numberOfLines={1}>{att.fileName}</Text>
                  <Text style={styles.attachSub}>
                    {[formatBytes(att.fileSize), att.uploadedByName, formatDate(att.uploadedDate)]
                      .filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </TouchableOpacity>

              {isAdmin && (
                deleting === att.attachmentId
                  ? <ActivityIndicator size="small" color="#C0392B" style={styles.deleteSpinner} />
                  : (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(att.attachmentId, att.fileName)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  )
              )}
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F0F2F5' },
  content:     { padding: 16, paddingBottom: 40 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:   { fontSize: 15, color: '#888' },

  title: {
    fontSize: 22, fontWeight: '800', color: '#1E3A5F',
    marginBottom: 16,
  },

  // Info card
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 16,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon:  { fontSize: 20, marginRight: 12, marginTop: 2 },
  infoLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '600' },

  // Section
  section: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 16, marginBottom: 16,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E3A5F', marginBottom: 12 },
  description:  { fontSize: 14, color: '#444', lineHeight: 22 },

  // Attachments header
  attachHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  uploadBtn: {
    backgroundColor: '#1E3A5F', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 7,
    minWidth: 80, alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText:     { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Empty state
  emptyAttach:     { alignItems: 'center', paddingVertical: 24 },
  emptyAttachIcon: { fontSize: 36, marginBottom: 8 },
  emptyAttachText: { fontSize: 14, color: '#888', fontWeight: '600' },
  emptyAttachSub:  { fontSize: 12, color: '#bbb', marginTop: 4 },

  // Attachment item
  attachItem: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    paddingVertical: 10,
  },
  attachMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  attachIcon: { fontSize: 28, marginRight: 12 },
  attachMeta: { flex: 1 },
  attachName: { fontSize: 14, color: '#1a1a1a', fontWeight: '600', marginBottom: 2 },
  attachSub:  { fontSize: 11, color: '#999' },

  deleteBtn:      { padding: 8 },
  deleteBtnText:  { fontSize: 18 },
  deleteSpinner:  { padding: 8 },
});

export default ActivityDetailScreen;
