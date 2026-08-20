import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { achievementService } from '../services/achievementService';
import { AchievementDetailScreenStyles as styles, CircularDetailScreenStyles as circStyles } from './screenStyles';
import GradientHeader from '../components/GradientHeader';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = '#252943';
const GOLD = '#A0C878';
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// Fallback styles for the attachment rows/buttons, in case
// AchievementDetailScreenStyles doesn't define these yet. Array styles let a
// later `styles.*` entry win if those keys do exist, so this is safe either way.
const local = StyleSheet.create({
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  attachImageCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  attachImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  attachHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  noAttach: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  // ── Simple left-aligned header — replaces the old circular photo hero.
  // Every field (Club, Member Name, Title, Date, Description) renders as a
  // labeled row using fieldBlock/detailLabel/fieldValue below, so they all
  // line up flush-left with identical spacing. ──
  simpleHeader: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 4,
  },
  fieldBlock: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 14,
  },
  fieldBlockLast: {
    marginBottom: 0,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
    textAlign: 'left',
  },
  fieldValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});

// filePath from the server is a raw disk path like "Uploads\achievements\xyz.jpg" —
// convert it into a URL the app can actually load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const isImagePath = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);
const isPdfPath = (path = '') => path?.toLowerCase().endsWith('.pdf');

const fileNameFromPath = (path = '') => path.split('/').pop().split('\\').pop();

const AchievementDetailScreen = ({ route, navigation }) => {
  const { item, memberPhoto } = route.params || {};

  const [imgViewer, setImgViewer] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadAttachments();
  }, [item?.achievementId]);

  const loadAttachments = async () => {
    setLoading(true);
    setAttachmentsError(null);
    try {
      const res = await achievementService.getAttachments(item.achievementId);

      if (res?.data) {
        setAttachments(res.data);
      }
    } catch (err) {
      console.log('ATTACHMENT ERROR', err);
      setAttachmentsError(
        err?.message === 'Network Error' || !err?.response
          ? 'Could not connect to the server. Check your internet connection and try again.'
          : 'Something went wrong while loading attachments.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  const dateStr = item.achievementDate
    ? new Date(item.achievementDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Club name — check every likely field name the API might return it under.
  const clubName = item.clubName || item.club || item.ClubName || '';

  // ── Download / share a non-image attachment — same pattern as SupportDetailScreen ──
  const handleAttachmentDownload = async (attachment) => {
    const filePath = attachment.filePath;
    const fileName = attachment.fileName || fileNameFromPath(filePath) || 'attachment';
    const rowId = attachment.attachmentId ?? fileName;
    const url = toPublicUrl(filePath);

    if (!url) return;

    setDownloadingId(rowId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const tempUri = FileSystem.cacheDirectory + fileName;

      const result = await FileSystem.downloadAsync(url, tempUri, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      if (result.status !== 200) {
        Alert.alert('Error', 'Failed to download file.');
        return;
      }

      if (Platform.OS === 'android') {
        const permission =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert('Permission Required', 'Please allow access to save the file.');
          return;
        }

        const base64 = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const extension = fileName.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        switch (extension) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'doc':
            mimeType = 'application/msword';
            break;
          case 'docx':
            mimeType =
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'xls':
            mimeType = 'application/vnd.ms-excel';
            break;
          case 'xlsx':
            mimeType =
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
        }

        const destUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          fileName.replace(/\.[^/.]+$/, ''),
          mimeType
        );

        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        Alert.alert('Success', `${fileName} saved successfully.`);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
          Alert.alert(
            'Saved',
            `"${fileName}" was downloaded, but sharing isn't available on this device.`
          );
          return;
        }
        await Sharing.shareAsync(tempUri);
      }
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Achievement</Text>
        <View style={{ width: 36 }} />
      </GradientHeader>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>Loading achievement...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {/* Club + Member Name + Title + Date + Description — all labeled, all left-aligned */}
          <View style={local.simpleHeader}>
            {!!clubName && (
              <View style={local.fieldBlock}>
                <Text style={local.detailLabel}>Club</Text>
                <Text style={local.fieldValue}>{clubName}</Text>
              </View>
            )}

            <View style={local.fieldBlock}>
              <Text style={local.detailLabel}>Member Name</Text>
              <Text style={local.fieldValue}>{item.memberName || 'Member'}</Text>
            </View>

            <View style={local.fieldBlock}>
              <Text style={local.detailLabel}>Title</Text>
              <Text style={local.fieldValue}>{item.title}</Text>
            </View>

            {dateStr ? (
              <View style={local.fieldBlock}>
                <Text style={local.detailLabel}>Date</Text>
                <View style={local.dateRow}>
                  <MaterialCommunityIcons name="calendar-check-outline" size={16} color={GOLD} />
                  <Text style={[styles.metaText, { marginLeft: 6 }]}>{dateStr}</Text>
                </View>
              </View>
            ) : null}

            {!!item.description && (
              <View style={[local.fieldBlock, local.fieldBlockLast]}>
                <Text style={local.detailLabel}>Description</Text>
                <Text style={local.fieldValue}>{item.description}</Text>
              </View>
            )}
          </View>

          {/* Attachments — always visible: label + empty state / error+retry / list */}
          <View style={styles.attachSection}>
            <Text style={styles.attachLabel}>
              Attachments{attachments.length > 0 ? ` (${attachments.length})` : ''}
            </Text>

            {attachmentsError ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <MaterialCommunityIcons name="wifi-off" size={28} color="#D9534F" />
                <Text style={{ color: '#D9534F', textAlign: 'center', marginTop: 6, marginBottom: 10 }}>
                  {attachmentsError}
                </Text>
                <TouchableOpacity
                  style={[styles.downloadBtn, local.downloadBtn, { backgroundColor: NAVY }]}
                  onPress={loadAttachments}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="reload" size={18} color="#fff" />
                  <Text style={[styles.downloadText, local.downloadText]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : attachments.length === 0 ? (
              <Text style={[styles.noAttach, local.noAttach]}>No attachments yet.</Text>
            ) : (
              attachments.map((attachment, index) => {
                const filePath = attachment.filePath;
                const url = toPublicUrl(filePath);
                const rowId = attachment.attachmentId ?? attachment.fileName ?? index;

                return isImagePath(filePath) ? (
                  <View key={rowId} style={local.attachImageCard}>
                    {!url ? (
                      <Text style={{ color: '#D9534F', fontSize: 12 }}>
                        Couldn't build image URL for this attachment.
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setImgViewer(url)}
                        activeOpacity={0.85}
                        style={{ width: '100%' }}
                      >
                        <Image
                          source={{ uri: url }}
                          style={[styles.attachImage, local.attachImage]}
                          resizeMode="contain"
                          onError={(e) =>
                            console.log('ATTACH IMAGE LOAD ERROR', url, e.nativeEvent?.error)
                          }
                          onLoad={() => console.log('ATTACH IMAGE LOADED OK', url)}
                        />
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.attachHint, local.attachHint]}>Tap to enlarge</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={rowId}
                    style={[
                      styles.downloadBtn,
                      local.downloadBtn,
                      downloadingId === rowId && { opacity: 0.7 },
                    ]}
                    onPress={() => handleAttachmentDownload(attachment)}
                    disabled={downloadingId === rowId}
                    activeOpacity={0.85}
                  >
                    {downloadingId === rowId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
                        <Text style={[styles.downloadText, local.downloadText]} numberOfLines={1}>
                          {attachment.fileName || fileNameFromPath(filePath) || 'Download Attachment'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Image viewer modal */}
      <Modal visible={!!imgViewer} transparent animationType="fade" onRequestClose={() => setImgViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: imgViewer }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

export default AchievementDetailScreen;