import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
// Place in: src/screens/JobPostingDetailScreen.js
// Attachments section now mirrors CircularDetailScreen.js: images open in a
// viewer modal, non-image files (pdf/doc/xls/etc.) get a download button.

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Modal,
  ActivityIndicator, StyleSheet, Alert, Platform, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jobPostingService } from '../services/jobpostingService';
import api from '../utils/api';
import { JobPostingDetailScreenStyles as styles } from './screenStyles';

const NAVY = COLORS.dark;
const GOLD = COLORS.accent;

// Fallback styles for pieces not (yet) defined in JobPostingDetailScreenStyles
// (download button / empty state). These merge on top of `styles.*` so if
// those keys get added to the stylesheet later, this still works — array
// styles let the later object win on any overlapping keys.
const local = StyleSheet.create({
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  downloadText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  noAttach: {
    color: COLORS.placeholder,
    fontSize: 13,
    marginTop: 4,
  },
});

// api.defaults.baseURL is usually something like "http://host:port/api" —
// strip the trailing "/api" so we get the plain server root to prefix the
// raw disk-style paths ("Uploads\JobPostings-4\xyz.jpg") that come back
// from the backend.
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server can be a raw disk path like "Uploads\JobPostings-4\xyz.jpg"
// (or "uploads/JobPostings-4/xyz.jpg") — convert it into a URL the app can
// actually load/display/download.
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

const JobPostingDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [imgViewer,     setImgViewer]     = useState(null);
  const [attachments,   setAttachments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  if (!item) return null;

  useEffect(() => { loadAttachments(); }, []);

  const loadAttachments = async () => {
    try {
      const res = await jobPostingService.getAttachments(item.jobPostingId);
      if (res?.data) setAttachments(res.data);
    } catch (err) {
      console.log('ATTACHMENT ERROR', err);
    } finally {
      setLoading(false);
    }
  };

  const isImage = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);

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

  const isClosed = item.vacancyClosingDate
    ? new Date(item.vacancyClosingDate) < new Date()
    : false;

  const closingDateStr = item.vacancyClosingDate
    ? new Date(item.vacancyClosingDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

  const handleOpenWebsite = () => {
    const url = (item.website || '').trim();
    if (!url) return;
    const withScheme = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    Linking.openURL(withScheme).catch(() =>
      Alert.alert('Error', 'Could not open this website.')
    );
  };

  const InfoRow = ({ icon, label, value }) =>
    value ? (
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name={icon} size={16} color={GOLD} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    ) : null;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      {/* ── Header ── */}
      <GradientHeader style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Job Posting</Text>
        <View style={{ width: 36 }} />
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Job title ── */}
        <Text style={styles.jobTitle}>{item.jobTitle}</Text>
        <Text style={styles.companyName}>{item.companyName}</Text>

        {/* ── Gold divider ── */}
        <View style={styles.goldDivider} />

        {/* ── Badges row ── */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.employmentType}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: COLORS.selected, borderColor: '#BFDBFE' }]}>
            <Text style={[styles.badgeText, { color: COLORS.primary }]}>{item.workMode}</Text>
          </View>
          {isClosed && (
            <View style={[styles.badge, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={[styles.badgeText, { color: '#C0392B' }]}>Closed</Text>
            </View>
          )}
        </View>

        {/* ── Key info ── */}
        <View style={styles.infoCard}>
          <InfoRow icon="map-marker-outline"      label="Location"        value={item.location} />
          <InfoRow icon="clock-outline"            label="Working Hours"   value={item.workingHours} />
          <InfoRow icon="currency-inr"             label="Salary Package"  value={item.salaryPackage} />
          <InfoRow icon="calendar-remove-outline"  label={isClosed ? 'Closed on' : 'Closes on'} value={closingDateStr} />
          <InfoRow icon="account-outline"          label="Posted by"       value={item.createdBy} />
        </View>

        {/* ── About the Role ── */}
        {item.aboutRole ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About the Role</Text>
            <Text style={styles.sectionText}>{item.aboutRole}</Text>
          </View>
        ) : null}

        {/* ── Required Skills ── */}
        {item.requiredSkillsExperience ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Required Skills & Experience</Text>
            <Text style={styles.sectionText}>{item.requiredSkillsExperience}</Text>
          </View>
        ) : null}

        {/* ── Contact ── */}
        {item.contactInfo ? (
          <View style={styles.contactCard}>
            <MaterialCommunityIcons name="email-outline" size={20} color={NAVY} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.contactLabel}>If Interested, Please Contact</Text>
              <Text style={styles.contactValue}>{item.contactInfo}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Website ── */}
        {item.website ? (
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleOpenWebsite}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="web" size={20} color={NAVY} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text
                style={[styles.contactValue, { color: COLORS.primary, textDecorationLine: 'underline' }]}
                numberOfLines={1}
              >
                {item.website}
              </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={NAVY} />
          </TouchableOpacity>
        ) : null}

        {/* ── Attachments ── */}
        <View style={styles.attachSection}>
          <Text style={styles.attachLabel}>Attachments</Text>

          {loading ? (
            <ActivityIndicator size="small" color={GOLD} style={{ marginTop: 10 }} />
          ) : attachments.length === 0 ? (
            <Text style={[styles.noAttach, local.noAttach]}>No attachments.</Text>
          ) : (
            attachments.map((attachment, index) => {
              const filePath = attachment.filePath ?? attachment.FilePath ?? '';
              const url = toPublicUrl(filePath);
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
                    local.downloadBtn,
                    downloadingId === (attachment.attachmentId ?? attachment.fileName) && { opacity: 0.7 },
                  ]}
                  onPress={() => handleDownloadAttachment(attachment)}
                  disabled={downloadingId === (attachment.attachmentId ?? attachment.fileName)}
                  activeOpacity={0.85}
                >
                  {downloadingId === (attachment.attachmentId ?? attachment.fileName)
                    ? <ActivityIndicator size="small" color={COLORS.white} />
                    : (
                      <>
                        <MaterialCommunityIcons name="download-outline" size={18} color={COLORS.white} />
                        <Text style={[styles.downloadText, local.downloadText]}>
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

      {/* ── Image viewer modal ── */}
      <Modal visible={!!imgViewer} transparent animationType="fade"
        onRequestClose={() => setImgViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color={COLORS.white} />
          </TouchableOpacity>
          {imgViewer && (
            <Image source={{ uri: imgViewer }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default JobPostingDetailScreen;