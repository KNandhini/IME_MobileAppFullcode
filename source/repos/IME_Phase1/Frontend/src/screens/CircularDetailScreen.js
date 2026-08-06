import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { circularService } from '../services/circularService';
import api from '../utils/api';
import { CircularDetailScreenStyles as styles } from './screenStyles';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

// Fallback styles for pieces not yet defined in CircularDetailScreenStyles
// (badge / chip / description card). These merge on top of `styles.*` so
// if those keys get added to the stylesheet later, this still works —
// array styles let the later object win on any overlapping keys.
const local = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chipWrap: {
    marginBottom: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#EAF1FB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '600',
  },
  descCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  descLabel: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  descText: {
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

// api.defaults.baseURL is usually something like "http://host:port/api"
// strip the trailing "/api" so we get the plain server root to prefix
// the raw disk-style paths ("Uploads\circulars\xyz.jpg") that come back
// from the backend.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server can be a raw disk path like "Uploads\circulars\xyz.jpg"
// (or "uploads/circulars/xyz.jpg") — convert it into a URL the app can load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.search(/uploads[\\/]/i);
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

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

const CircularDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [attachments, setAttachments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [imgViewer,   setImgViewer]   = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  if (!item) return null;

  useEffect(() => { loadAttachments(); }, []);

  const loadAttachments = async () => {
    try {
      const res = await circularService.getById(item.circularId);
      if (res?.success) setAttachments(res.data?.attachments ?? []);
    } catch (e) {
      console.error('Load attachments error:', e);
    } finally {
      setLoading(false);
    }
  };

  const isImage = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);

  const handleDownloadAttachment = async (att) => {
    const filePath = att.filePath ?? att.FilePath ?? '';
    const url = toPublicUrl(filePath);
    const fileName = att.fileName ?? filePath.split(/[\\/]/).pop() ?? 'attachment';
    const rowId = att.attachmentId ?? fileName;
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

  const publishDate = item.publishDate
    ? new Date(item.publishDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {/* Header */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Circular</Text>
        <View style={styles.headerBtn} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Badge */}
        <View style={[styles.badge, local.badge]}>
          <MaterialCommunityIcons name="file-document-outline" size={14} color={GOLD} />
          <Text style={[styles.badgeText, local.badgeText]}>Circular</Text>
        </View>

        {/* Circular number chip */}
        {item.circularNumber ? (
          <View style={[styles.chipWrap, local.chipWrap]}>
            <View style={[styles.chip, local.chip]}>
              <MaterialCommunityIcons name="tag-outline" size={14} color={NAVY} />
              <Text style={[styles.chipText, local.chipText]}>{item.circularNumber}</Text>
            </View>
          </View>
        ) : null}

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Date + gold bar */}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="calendar-outline" size={15} color={GOLD} />
          <Text style={styles.metaText}>{publishDate || 'Date not specified'}</Text>
        </View>
        <View style={styles.goldDivider} />

        {/* Description */}
        {item.description ? (
          <View style={[styles.descCard, local.descCard]}>
            <Text style={[styles.descLabel, local.descLabel]}>About this circular</Text>
            <Text style={[styles.descText, local.descText]}>{item.description}</Text>
          </View>
        ) : (
          <Text style={styles.noDesc}>No additional details provided.</Text>
        )}

        {/* ── Attachments ── */}
        <View style={styles.attachSection}>
          <Text style={styles.attachLabel}>Attachments</Text>

          {loading ? (
            <ActivityIndicator size="small" color={NAVY} style={{ marginTop: 10 }} />
          ) : attachments.length === 0 ? (
            <Text style={styles.noAttach}>No attachments.</Text>
          ) : (
            attachments.map((att, index) => {
              const filePath = att.filePath ?? att.FilePath ?? '';
              const url = toPublicUrl(filePath);
              return isImage(filePath) ? (
                <TouchableOpacity
                  key={att.attachmentId ?? index}
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
                  key={att.attachmentId ?? index}
                  style={[
                    styles.downloadBtn,
                    downloadingId === (att.attachmentId ?? att.fileName) && { opacity: 0.7 },
                  ]}
                  onPress={() => handleDownloadAttachment(att)}
                  disabled={downloadingId === (att.attachmentId ?? att.fileName)}
                  activeOpacity={0.85}
                >
                  {downloadingId === (att.attachmentId ?? att.fileName)
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : (
                      <>
                        <MaterialCommunityIcons name="download-outline" size={18} color={COLORS.white} />
                        <Text style={styles.downloadText}>
                          {att.fileName ?? 'Download Attachment'}
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
      <Modal
        visible={!!imgViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setImgViewer(null)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color={COLORS.white} />
          </TouchableOpacity>
          {imgViewer && (
            <Image
              source={{ uri: imgViewer }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};



export default CircularDetailScreen;