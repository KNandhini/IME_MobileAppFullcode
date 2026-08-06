import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Alert, ScrollView, TouchableOpacity, Animated, Platform, Image, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { fundraiseService } from '../services/fundraiseService';
import { getSafeErrorMessage } from '../utils/errorHandler';
import api from '../utils/api';
import { FundraiseViewScreenStyles as styles, FundraiseViewScreenSc as sc, FundraiseViewScreenIr as ir, FundraiseViewScreenPb as pb } from './screenStyles';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY = '#1E3A5F';
const ACCENT  = '#2E86DE';
const SUCCESS = '#27AE60';
const DANGER  = '#E74C3C';
const BG      = '#F0F4FA';

const URGENCY = {
  Critical: { bg: '#FDE8E8', text: '#C0392B', dot: '#E74C3C' },
  Urgent:   { bg: '#FEF3E2', text: '#D35400', dot: '#F39C12' },
  Normal:   { bg: '#E8F8F0', text: '#1E8449', dot: '#27AE60' },
};

// Fallback styles for attachments, in case FundraiseViewScreenStyles doesn't
// define these yet. Array styles let a later `styles.*` entry win if those
// keys do exist, so this is safe to keep either way.
const local = StyleSheet.create({
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
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PRIMARY,
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
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  viewerCloseText: {
    color: '#fff',
    fontSize: 28,
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
});

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// filePath from the server can be a raw disk path like "Uploads\Fundraise-5\xyz.jpg"
// — convert it into a URL the app can actually load/display/download.
// Same helper as MagazineDetailScreen / SupportDetailScreen for consistency.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;

  const normalized = filePath.replace(/\\/g, '/');
  const idx = normalized.search(/uploads\//i);

  if (idx === -1) {
    // No "Uploads" segment in the stored value at all (e.g. it's just
    // "Fundraise-5/abc.png") — treat it as already relative to the
    // Uploads folder, same fallback as buildPhotoUrl() in CreateFundScreen.
    const clean = normalized.replace(/^\/+/, '');
    return `${API_BASE}/Uploads/${clean}`;
  }

  const relative = normalized.substring(idx); // "Uploads/Fundraise-5/abc.png"
  return `${API_BASE}/${relative}`;
};

// ── NEW: Fundraise stores MULTIPLE photos/docs as a single comma-joined
// string (unlike Magazines, which has one row per attachment). Splitting
// this out is required — passing the whole comma-joined string into
// toPublicUrl() in one go mangles every path after the first.
const parsePaths = (raw) => {
  if (!raw) return [];
  return raw.split(',').map(p => p.trim()).filter(Boolean);
};

const isImagePath = (path) => path?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
const isPdfPath = (path) => path?.toLowerCase().endsWith('.pdf');

// Strip any folder prefix — "Uploads\Fundraise-5\abc.pdf",
// "Fundraise-5/abc.pdf", or a full URL all resolve to just "abc.pdf".
// Handles both slash types, so it works whether we're given the raw
// stored path or the built URL.
const getFileNameFromUrl = (pathOrUrl) => {
  if (!pathOrUrl) return 'attachment';
  return pathOrUrl
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.split('?')[0] || 'attachment';
};

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ collected, target }) {
  const anim = useRef(new Animated.Value(0)).current;
  const pct  = target > 0 ? Math.min((collected / target) * 100, 100) : 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const color = pct >= 75 ? SUCCESS : pct >= 40 ? ACCENT : '#F39C12';

  return (
    <View>
      <View style={pb.track}>
        <Animated.View style={[pb.fill, { width, backgroundColor: color }]} />
      </View>
      <View style={pb.labels}>
        <Text style={pb.labelText}>₹{collected.toLocaleString('en-IN')} raised</Text>
        <Text style={[pb.labelText, { color: PRIMARY, fontWeight: '700' }]}>
          {Math.round(pct)}%
        </Text>
        <Text style={pb.labelText}>of ₹{target.toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={ir.row}>
      <View style={ir.iconWrap}>
        <Text style={ir.icon}>{icon}</Text>
      </View>
      <View style={ir.content}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <View style={sc.card}>
      <Text style={sc.title}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const FundraiseViewScreen = ({ route, navigation }) => {
  const { data } = route.params;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const [viewer, setViewer] = useState({ visible: false, uri: null });
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const target    = Number(data.targetAmount)    || 0;
  const collected = Number(data.collectedAmount) || 0;
  const balance   = Number(data.balanceAmount)   || target;
  const urgency   = URGENCY[data.urgencyLevel]   || URGENCY.Normal;

  // ── Build attachment list from available document/photo fields ──
  // FIX: beneficiaryPhotoUrl / supportingDocumentUrl can each hold MULTIPLE
  // comma-joined paths (e.g. "Fundraise-5/a.png,Fundraise-5/b.png"). We must
  // split them BEFORE calling toPublicUrl() — otherwise the whole
  // comma-joined string gets treated as one path and every image after the
  // first breaks (and even the first can end up with a trailing garbage
  // suffix). Each individual path is converted with toPublicUrl() so raw
  // disk paths like "Uploads\Fundraise-5\xyz.jpg" resolve correctly.
  const attachments = [
    ...parsePaths(data.beneficiaryPhotoUrl).map((p) => ({
      url: toPublicUrl(p),
      fileName: getFileNameFromUrl(p), // just "abc.png", no "Uploads\Fundraise-5\" prefix
      rawPath: p,
    })),
    ...parsePaths(data.supportingDocumentUrl).map((p) => ({
      url: toPublicUrl(p),
      fileName: getFileNameFromUrl(p), // just "abc.pdf", no "Uploads\Fundraise-5\" prefix
      rawPath: p,
    })),
  ];

// ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    Alert.alert('Delete Fund', 'Are you sure you want to delete this fund?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fundraiseService.delete(id);
            if (res?.success) {
              Alert.alert('Success', res?.message || 'Deleted successfully.');
              loadData(true);
            } else {
              Alert.alert('Error', res?.message || 'Failed to delete fund.');
            }
          } catch (e) {
            const apiMessage =
              e?.response?.data?.message ||
              e?.response?.data?.title ||
              e?.message ||
              'Failed to delete fund.';
            Alert.alert('Error', apiMessage);
          }
        },
      },
    ]);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  // ── Download / share a non-image attachment — same pattern as SupportDetailScreen ──
  const handleAttachmentDownload = async (attachment) => {
    debugger;
    const fileName = attachment.fileName || 'attachment';
    const rowId = attachment.url;
    setDownloadingId(rowId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const tempUri = FileSystem.cacheDirectory + fileName;
debugger;
      const result = await FileSystem.downloadAsync(attachment.url, tempUri, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
debugger;
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

  return (
    <View style={styles.container}>

      

      <Animated.ScrollView
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          {/* Category + urgency */}
          <View style={styles.heroMeta}>
            {data.fundCategory ? (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{data.fundCategory}</Text>
              </View>
            ) : null}
            {data.urgencyLevel ? (
              <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                <View style={[styles.urgencyDot, { backgroundColor: urgency.dot }]} />
                <Text style={[styles.urgencyText, { color: urgency.text }]}>
                  {data.urgencyLevel}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.fundTitle}>{data.fundTitle || 'Untitled Fund'}</Text>

          {data.description ? (
            <Text style={styles.description}>{data.description}</Text>
          ) : null}

          {/* Progress */}
          <View style={styles.progressWrap}>
            <ProgressBar collected={collected} target={target} />
          </View>

          {/* Amount tiles */}
          <View style={styles.amountGrid}>
            <View style={[styles.amountTile, { backgroundColor: '#E8F8F0' }]}>
              <Text style={styles.amountTileVal}>₹{collected.toLocaleString('en-IN')}</Text>
              <Text style={[styles.amountTileLabel, { color: SUCCESS }]}>Collected</Text>
            </View>
            <View style={[styles.amountTile, { backgroundColor: '#EEF5FF' }]}>
              <Text style={[styles.amountTileVal, { color: PRIMARY }]}>
                ₹{target.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.amountTileLabel, { color: ACCENT }]}>Target</Text>
            </View>
            <View style={[styles.amountTile, { backgroundColor: '#FEF3E2' }]}>
              <Text style={[styles.amountTileVal, { color: '#D35400' }]}>
                ₹{balance.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.amountTileLabel, { color: '#D35400' }]}>Balance</Text>
            </View>
          </View>
        </View>

        {/* ── Beneficiary ── */}
        <SectionCard title="👤  Beneficiary Info">
          <InfoRow icon="🙍" label="Full Name"          value={data.fullName} />
          <InfoRow icon="🎂" label="Age"                value={data.age?.toString()} />
          <InfoRow icon="⚧️" label="Gender"             value={data.gender} />
          <InfoRow icon="📍" label="Place"              value={data.place} />
          <InfoRow icon="🏠" label="Address"            value={data.address} />
          <InfoRow icon="📞" label="Contact"            value={data.contactNumber} />
          <InfoRow icon="🤝" label="Relation"           value={data.relationToCommunity} />
        </SectionCard>

        {/* ── Campaign ── */}
        <SectionCard title="📅  Campaign Info">
          <InfoRow icon="🗓️" label="Start Date"  value={formatDate(data.startDate)} />
          <InfoRow icon="🏁" label="End Date"    value={formatDate(data.endDate)} />
          <InfoRow icon="🔖" label="Status"      value={data.status} />
          <InfoRow icon="👷" label="Created By"  value={data.createdBy} />
          <InfoRow icon="✏️" label="Modified By" value={data.modifiedBy} />
        </SectionCard>

        {/* ── Bank ── */}
        <SectionCard title="🏦  Bank Details">
          <InfoRow icon="👤" label="Account Holder" value={data.accountHolderName} />
          <InfoRow icon="🏧" label="Account Number" value={data.bankAccountNumber} />
          <InfoRow icon="🔢" label="IFSC Code"      value={data.ifscCode} />
          <InfoRow icon="📲" label="UPI ID"         value={data.upiId} />
        </SectionCard>

        {/* ── Documents — Magazine-style: images inline w/ "Tap to enlarge", files as download buttons showing exact file name ── */}
        {attachments.length > 0 && (
          <SectionCard title="Attachments">
            <View>
              {attachments.map((a, idx) => {
                const rowId = `${a.url}-${idx}`;
                return isImagePath(a.rawPath) ? (
                  <TouchableOpacity
                    key={rowId}
                    onPress={() => setViewer({ visible: true, uri: a.url })}
                    activeOpacity={0.85}
                    style={{ marginBottom: 14 }}
                  >
                    <Image source={{ uri: a.url }} style={local.attachImage} resizeMode="contain" />
                    <Text style={local.attachHint}>Tap to enlarge</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={rowId}
                    style={[
                      local.downloadBtn,
                      downloadingId === a.url && { opacity: 0.7 },
                    ]}
                    onPress={() => handleAttachmentDownload(a)}
                    disabled={downloadingId === a.url}
                    activeOpacity={0.85}
                  >
                    {downloadingId === a.url ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name={isPdfPath(a.rawPath) ? 'file-pdf-box' : 'download-outline'}
                          size={18}
                          color="#fff"
                        />
                        <Text style={local.downloadText} numberOfLines={1}>{a.fileName}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
        )}

        {/* ── Actions ── */}
        {/*<View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('CreateFund', { data })}
          >
            <Text style={styles.editBtnIcon}>✏️</Text>
            <Text style={styles.editBtnText}>Edit Fund</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnIcon}>🗑️</Text>
            <Text style={styles.deleteBtnText}>Delete Fund</Text>
          </TouchableOpacity>
        </View>*/}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ── Full-screen image viewer ── */}
      <Modal
        visible={viewer.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewer({ visible: false, uri: null })}
      >
        <View style={local.viewerOverlay}>
          <TouchableOpacity
            style={local.viewerClose}
            onPress={() => setViewer({ visible: false, uri: null })}
          >
            <Text style={local.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {viewer.uri && (
            <Image
              source={{ uri: viewer.uri }}
              style={local.viewerImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default FundraiseViewScreen;