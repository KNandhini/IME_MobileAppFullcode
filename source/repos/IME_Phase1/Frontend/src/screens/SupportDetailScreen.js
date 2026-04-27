import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, StatusBar, Linking, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supportService } from '../services/supportService';
import { BASE_URL } from '../utils/api';

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

const SupportDetailScreen = ({ navigation, route }) => {
  const { supportId, item: preloadedItem } = route.params || {};

  const [detail,   setDetail]   = useState(preloadedItem ?? null);
  const [loading,  setLoading]  = useState(!preloadedItem);
  const [imgError, setImgError] = useState(false);
  const [viewer,   setViewer]   = useState({ visible: false, uri: null });

  useEffect(() => {
    loadDetail();
  }, [supportId]);

  const loadDetail = async () => {
    if (!supportId) return;
    try {
      setLoading(true);
      const res = await supportService.getById(supportId);
      const data = res?.data ?? res;
      if (data) setDetail(data);
    } catch (e) {
      console.error('SupportDetail load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const openAttachment = (a) => {
    const uri = supportService.getAttachmentUrl(a.attachmentId);
    const type = a.mediaType?.trim();
    if (type === 'image') {
      setViewer({ visible: true, uri });
    } else {
      Linking.openURL(uri);
    }
  };

  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />
        <Text style={styles.errorText}>Unable to load details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const avatarColor  = categoryColor(detail.categoryId);
  const initial      = (detail.clubName || detail.title || '?').charAt(0).toUpperCase();
  const logoUri      = detail.clubId && detail.logoPath
    ? `${BASE_URL}/Uploads/${detail.logoPath.replace(/\\/g, '/')}`
    : null;
  const attachments  = detail.attachments ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#1E3A5F" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Support Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{detail.categoryName?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Avatar + title block */}
        <View style={styles.titleBlock}>
          {logoUri && !imgError ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.avatar}
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

        {/* Key stats row */}
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

        {/* Company name (if applicable) */}
        {!!detail.companyName && detail.companyOrIndividual === 'Company' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMPANY</Text>
            <Text style={styles.sectionText}>{detail.companyName}</Text>
          </View>
        )}

        {/* Description */}
        {!!detail.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.descriptionText}>{detail.description}</Text>
          </View>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ATTACHMENTS ({attachments.length})</Text>
            <View style={styles.attachGrid}>
              {attachments.map((a) => {
                const type = a.mediaType?.trim();
                return (
                  <TouchableOpacity
                    key={a.attachmentId}
                    style={styles.thumb}
                    onPress={() => openAttachment(a)}
                    activeOpacity={0.8}
                  >
                    {type === 'image' ? (
                      <Image
                        source={{ uri: supportService.getAttachmentUrl(a.attachmentId) }}
                        style={styles.thumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbDoc}>
                        <Text style={styles.thumbDocIcon}>
                          {type === 'video' ? '🎬' : '📄'}
                        </Text>
                        <Text style={styles.thumbDocName} numberOfLines={2}>
                          {a.fileName}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Image viewer */}
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
            <Image source={{ uri: viewer.uri }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#F7F9FC' },
  fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
  errorText:  { fontSize: 15, color: '#718096', marginBottom: 16 },
  backBtn:    { backgroundColor: '#1E3A5F', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  backBtnText:{ color: '#fff', fontWeight: '700' },

  header: {
    backgroundColor: '#1E3A5F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  closeBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeIcon:   { fontSize: 18, color: '#fff', fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  badgeRow: { marginBottom: 14 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, color: '#2B6CB0', fontWeight: '700', letterSpacing: 0.5 },

  titleBlock:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar:      { width: 60, height: 60, borderRadius: 30, marginRight: 14 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    marginRight: 14, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 24, fontWeight: '800' },
  titleMeta:   { flex: 1 },
  title:       { fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 4 },
  clubName:    { fontSize: 13, color: '#4A5568', fontWeight: '500' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: 8,
  },
  statBox:   { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#A0AEC0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#2D3748', textAlign: 'center' },
  amountValue: { color: '#276749', fontSize: 16 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionLabel:    { fontSize: 10, color: '#A0AEC0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  sectionText:     { fontSize: 15, color: '#2D3748', fontWeight: '600' },
  descriptionText: { fontSize: 14, color: '#4A5568', lineHeight: 22 },

  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: {
    width: 90, height: 90, borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbImg:     { width: '100%', height: '100%' },
  thumbDoc:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6 },
  thumbDocIcon: { fontSize: 28 },
  thumbDocName: { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 4 },

  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  viewerImage:   { width: '100%', height: '80%' },
  viewerClose:   { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default SupportDetailScreen;
