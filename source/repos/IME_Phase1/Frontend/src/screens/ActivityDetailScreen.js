import { COLORS } from './theme';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activityService } from '../services/activityService';
import api from '../utils/api';
import { ActivityDetailScreenStyles as styles } from './screenStyles';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
// Some endpoints return a raw disk path like "Uploads\activities\xyz.jpg"
// instead of a loadable URL — normalize it so <Image> can actually fetch it.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const isImage = (fileName = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(fileName);

const MIME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
};

const getMimeType = (fileName = '') => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const ActivityDetailScreen = ({ route, navigation }) => {
  const { activityId } = route.params;

  const [activity,    setActivity]    = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [imgViewer,   setImgViewer]   = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    init();
  }, [activityId]);

  const init = async () => {
    setLoading(true);
    try {
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
      debugger;
      const res = await activityService.getAttachments(activityId);
      if (res.success) setAttachments(res.data || []);
      
    } catch (e) {
      console.error('loadAttachments error:', e);
    }
  }, [activityId]);

  const handleDownloadAttachment = async (attachment) => {
    const filePath = attachment.filePath ?? attachment.FilePath ?? '';
    const url = toPublicUrl(filePath);
    const fileName = attachment.fileName ?? filePath.split(/[\\/]/).pop() ?? 'attachment';
    const rowId = attachment.attachmentId ?? fileName;
    if (!url) return;

    setDownloadingId(rowId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const tempUri = FileSystem.cacheDirectory + fileName;
      const downloadResult = await FileSystem.downloadAsync(url, tempUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (downloadResult.status !== 200) {
        let serverMessage = `HTTP ${downloadResult.status}`;
        try {
          const body = await FileSystem.readAsStringAsync(tempUri);
          if (body) serverMessage = body.slice(0, 300);
        } catch (readErr) { }
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
        throw new Error(serverMessage);
      }

      const mimeType = getMimeType(fileName);

      if (Platform.OS === 'android') {
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Permission needed',
            'Storage permission is required to save the file. Please try again and allow access.'
          );
          return;
        }

        const fileContent = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          fileName.replace(/\.[^/.]+$/, ''),
          mimeType
        );
        await FileSystem.writeAsStringAsync(destUri, fileContent, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert('Saved', `"${fileName}" was saved to the folder you selected.`);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert('Saved', `"${fileName}" was downloaded, but sharing isn't available on this device.`);
          return;
        }
        await Sharing.shareAsync(tempUri, {
          mimeType,
          dialogTitle: `Save "${fileName}"`,
        });
      }
    } catch (err) {
      console.error('Attachment download error:', err);
      Alert.alert('Download Failed', err.message || 'Could not download the attachment.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOLD} />
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
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {/* Header */}
      
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🗓️ Activity</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{activity.activityName}</Text>

        {/* Gold divider */}
   

        {/* Meta rows */}
        <View style={styles.metaWrap}>
          {activity.activityDate ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="calendar-check-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{formatDate(activity.activityDate)}</Text>
            </View>
          ) : null}
          {activity.time ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{activity.time}</Text>
            </View>
          ) : null}
          {activity.venue ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{activity.venue}</Text>
            </View>
          ) : null}
          {activity.chiefGuest ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="account-star-outline" size={16} color={GOLD} />
              <Text style={styles.metaText}>{activity.chiefGuest}</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        {activity.description ? (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>About this activity</Text>
            <Text style={styles.descText}>{activity.description}</Text>
          </View>
        ) : null}

        {/* Attachments */}
        <View style={styles.attachSection}>
          <Text style={styles.attachLabel}>Attachments</Text>

          {attachments.length === 0 ? (
            <Text style={styles.noAttach}>No attachments yet.</Text>
          ) : (
            attachments.map((attachment, index) => {
              const filePath = attachment.filePath;
              const url = toPublicUrl(filePath);
              const rowId = attachment.attachmentId ?? attachment.fileName ?? index;

              return isImage(filePath) ? (
                <TouchableOpacity
                  key={attachment.attachmentId ?? index}
                  onPress={() => setImgViewer(url)}
                  activeOpacity={0.85}
                  style={{ marginBottom: 14 }}
                >
                  <Image
                    source={{ uri: url }}
                    style={styles.attachImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.attachHint}>Tap to enlarge</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={attachment.attachmentId ?? index}
                  style={[
                    styles.downloadBtn,
                    downloadingId === rowId && { opacity: 0.7 },
                  ]}
                  onPress={() => handleDownloadAttachment(attachment)}
                  disabled={downloadingId === rowId}
                  activeOpacity={0.85}
                >
                  {downloadingId === rowId
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : (
                      <>
                        <MaterialCommunityIcons name="download-outline" size={18} color={COLORS.white} />
                        <Text style={styles.downloadText}>
                          {attachment.fileName ?? 'Download Attachment'}
                        </Text>
                      </>
                    )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Image viewer modal */}
      <Modal visible={!!imgViewer} transparent animationType="fade" onRequestClose={() => setImgViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color={COLORS.white} />
          </TouchableOpacity>
          <Image source={{ uri: imgViewer }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};



export default ActivityDetailScreen;