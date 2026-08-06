import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar, Modal, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { supportService } from '../services/supportService';
import { clubService } from '../services/clubService';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import { SupportDetailScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = '#1E3A5F';

// Fallback styles for the download button, in case SupportDetailScreenStyles
// doesn't define these yet. Array styles let a later `styles.*` entry win if
// those keys do exist, so this is safe to keep either way.
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
  attachImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  attachHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server is a raw disk path like "Uploads\Clubs-11\xyz.jpg" or
// "Uploads\Support-4\abc.pdf" — convert it into a URL the app can actually load.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};

const categoryColor = (id) => {
  const map = { 1: '#3182CE', 2: '#805AD5', 3: '#38A169', 4: '#D97706', 5: '#DD6B20' };
  return map[id] ?? '#718096';
};

const formatDate = (str) => {
  if (!str) return '';
  return str.substring(0, 10);
};

const formatAmount = (val) =>
  val != null ? `₹${Number(val).toLocaleString('en-IN')}` : null;

const isImagePath = (path) => path?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
const isPdfPath = (path) => path?.toLowerCase().endsWith('.pdf');

const SupportDetailScreen = ({ navigation, route }) => {
  const { supportId, item: preloadedItem } = route.params || {};

  const [detail,       setDetail]       = useState(preloadedItem ?? null);
  const [loading,      setLoading]      = useState(!preloadedItem);
  const [imgError,     setImgError]     = useState(false);
  const [viewer,       setViewer]       = useState({ visible: false, uri: null });
  const [downloadingId, setDownloadingId] = useState(null);
  // ── Club logo: seed from the enriched image already passed by the list ──
  const [clubLogoUri,  setClubLogoUri]  = useState(preloadedItem?.image ?? null);

  useEffect(() => {
    loadDetail();
  }, [supportId]);

  const loadDetail = async () => {
    if (!supportId) return;
    try {
      setLoading(true);
      const res  = await supportService.getById(supportId);
      const data = res?.data ?? res;

      if (data) {
        setDetail(data);

        // ── Resolve club logo ──────────────────────────────────────────────
        // Priority 1: logo URL already passed via navigation (no extra call)
        if (preloadedItem?.image) {
          setClubLogoUri(preloadedItem.image);

        // Priority 2: API returned logoPath on the detail object itself
        } else if (data.clubId && data.logoPath) {
          setClubLogoUri(toPublicUrl(data.logoPath));

        // Priority 3: fetch clubs list to find the matching logo
        } else if (data.clubId) {
          try {
            const clubRes = await clubService.getAll(1, 200, '', true);
            if (clubRes?.success && clubRes?.data) {
              const club = clubRes.data.find((c) => c.clubId === data.clubId);
              if (club?.logoPath) {
                setClubLogoUri(toPublicUrl(club.logoPath));
              }
            }
          } catch (clubErr) {
            console.error('Club logo fetch error:', clubErr);
          }
        }
      }
    } catch (e) {
      console.error('SupportDetail load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Resolve an attachment's URL: prefer the raw filePath (same pattern as
  // AchievementDetailScreen), fall back to the service helper if filePath
  // isn't present on the record.
  const getAttachmentSrc = (a) =>
    toPublicUrl(a.filePath) ?? supportService.getAttachmentUrl(a.attachmentId);

  // ── Download / share a non-image attachment — same pattern as MagazineDetailScreen ──
  const handleAttachmentDownload = async (attachment) => {
    const fileName = attachment.fileName || 'attachment';
    const rowId = attachment.attachmentId ?? fileName;
    setDownloadingId(rowId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = getAttachmentSrc(attachment);
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
          case 'pdf': mimeType = 'application/pdf'; break;
          case 'jpg':
          case 'jpeg': mimeType = 'image/jpeg'; break;
          case 'png': mimeType = 'image/png'; break;
          case 'doc': mimeType = 'application/msword'; break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'xls': mimeType = 'application/vnd.ms-excel'; break;
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
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
          Alert.alert('Saved', `"${fileName}" was downloaded, but sharing isn't available on this device.`);
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

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.dark} />
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (!detail) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />
        <Text style={styles.errorText}>Unable to load details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarColor = categoryColor(detail.categoryId);
  const initial     = (detail.clubName || detail.title || '?').charAt(0).toUpperCase();
  const attachments = detail.attachments ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {/* ── Header ── */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Support Details</Text>
        <View style={{ width: 40 }} />
      </GradientHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Category badge ── */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{detail.categoryName?.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Avatar + title block ── */}
        <View style={styles.titleBlock}>
          {clubLogoUri && !imgError ? (
            <Image
              source={{ uri: clubLogoUri }}
              style={styles.avatar}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}

          <View style={styles.titleMeta}>
            <Text style={styles.title}>{detail.title}</Text>
            {!!detail.clubName && (
              <Text style={styles.clubName}>{detail.clubName}</Text>
            )}
          </View>
        </View>

        {/* ── Key stats row ── */}
        <View style={styles.statsRow}>
          {detail.amount != null && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Amount</Text>
              <Text style={[styles.statValue, styles.amountValue]}>
                {formatAmount(detail.amount)}
              </Text>
            </View>
          )}
          {!!detail.companyOrIndividual && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>{detail.companyOrIndividual}</Text>
            </View>
          )}
          {!!detail.supportDate && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Date</Text>
              <Text style={styles.statValue}>{formatDate(detail.supportDate)}</Text>
            </View>
          )}
        </View>

        {/* ── Company name ── */}
        {!!detail.companyName && detail.companyOrIndividual === 'Company' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMPANY</Text>
            <Text style={styles.sectionText}>{detail.companyName}</Text>
          </View>
        )}

        {/* ── Description ── */}
        {!!detail.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>{detail.description}</Text>
          </View>
        )}

        {/* ── Attachments — Magazine-style: images inline w/ "Tap to enlarge", files as download buttons ── */}
        {attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ATTACHMENTS ({attachments.length})</Text>
            <View style={styles.attachSection}>
              {attachments.map((a) => {
                const url = getAttachmentSrc(a);
                const rowId = a.attachmentId ?? a.fileName;
                return isImagePath(a.filePath) ? (
                  <TouchableOpacity
                    key={rowId}
                    onPress={() => setViewer({ visible: true, uri: url })}
                    activeOpacity={0.85}
                    style={{ marginBottom: 14 }}
                  >
                    <Image source={{ uri: url }} style={[styles.attachImage, local.attachImage]} resizeMode="contain" />
                    <Text style={[styles.attachHint, local.attachHint]}>Tap to enlarge</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={rowId}
                    style={[
                      styles.downloadBtn,
                      local.downloadBtn,
                      downloadingId === rowId && { opacity: 0.7 },
                    ]}
                    onPress={() => handleAttachmentDownload(a)}
                    disabled={downloadingId === rowId}
                    activeOpacity={0.85}
                  >
                    {downloadingId === rowId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name={isPdfPath(a.filePath) ? 'file-pdf-box' : 'download-outline'}
                          size={18}
                          color="#fff"
                        />
                        <Text style={[styles.downloadText, local.downloadText]}>
                          {a.fileName ?? 'Download Attachment'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Full-screen image viewer ── */}
      <Modal
        visible={viewer.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer({ visible: false, uri: null })}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewer({ visible: false, uri: null })}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {viewer.uri && (
            <Image
              source={{ uri: viewer.uri }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};



export default SupportDetailScreen;