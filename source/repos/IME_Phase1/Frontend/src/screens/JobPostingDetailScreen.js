// Place in: src/screens/JobPostingDetailScreen.js
// Mirrors AchievementDetailScreen.js structure exactly.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Image, Linking, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jobPostingService } from '../services/jobpostingService';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
import api from '../utils/api';
// filePath from the server is a raw disk path like "Uploads\JobPostings-4\xyz.jpg" —
// convert it into a URL the app can actually load/display/download.
const toPublicUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  const idx = filePath.indexOf('Uploads\\');
  if (idx === -1) return filePath;
  const relative = filePath.substring(idx).replace(/\\/g, '/');
  return `${API_BASE}/${relative}`;
};
const JobPostingDetailScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [imgViewer,    setImgViewer]    = useState(null);
  const [attachments,  setAttachments]  = useState([]);

  if (!item) return null;

  useEffect(() => { loadAttachments(); }, []);

  const loadAttachments = async () => {
    try {
      const res = await jobPostingService.getAttachments(item.jobPostingId);
      if (res?.data) setAttachments(res.data);
    } catch (err) {
      console.log('ATTACHMENT ERROR', err);
    }
  };

  const isImage = (path = '') => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(path);

  const isClosed = item.vacancyClosingDate
    ? new Date(item.vacancyClosingDate) < new Date()
    : false;

  const closingDateStr = item.vacancyClosingDate
    ? new Date(item.vacancyClosingDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

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
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Job Posting</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Hero: briefcase icon ── */}
       

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
          <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>{item.workMode}</Text>
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

        {/* ── Attachments (same as AchievementDetailScreen) ── */}
        {attachments.length > 0 && (
          <View style={styles.attachSection}>
            <Text style={styles.attachLabel}>Attachments</Text>
           {attachments.map((attachment, index) => {
  const filePath = attachment.filePath;
  const url = toPublicUrl(filePath);
  return isImage(filePath) ? (
    <TouchableOpacity
      key={attachment.attachmentId || index}
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
      key={attachment.attachmentId || index}
      style={styles.downloadBtn}
      onPress={() => Linking.openURL(url)}
    >
      <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
      <Text style={styles.downloadText}>
        {attachment.fileName || 'Download Attachment'}
      </Text>
    </TouchableOpacity>
  );
})}
          </View>
        )}
      </ScrollView>

      {/* ── Image viewer modal ── */}
      <Modal visible={!!imgViewer} transparent animationType="fade"
        onRequestClose={() => setImgViewer(null)}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImgViewer(null)}>
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: imgViewer }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12, paddingHorizontal: 12,
  },
  headerBtn:   { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

  body: { padding: 20, paddingBottom: 40, alignItems: 'center' },

  heroSection:    { marginBottom: 16, marginTop: 8 },
  heroIconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: GOLD,
  },

  jobTitle:    { fontSize: 20, fontWeight: '800', color: NAVY, textAlign: 'center', marginBottom: 4 },
  companyName: { fontSize: 15, color: '#64748B', textAlign: 'center', fontWeight: '500', marginBottom: 12 },

  goldDivider: { width: 56, height: 3, backgroundColor: GOLD, borderRadius: 2, marginBottom: 16 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  badge:    {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: GOLD, backgroundColor: '#FFFBEB',
    marginRight: 8, marginBottom: 6,
  },
  badgeText: { fontSize: 12, color: '#92400E', fontWeight: '600' },

  infoCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  infoValue: { fontSize: 14, color: '#334155', fontWeight: '500', marginTop: 2 },

  section: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: GOLD, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  sectionText:  { fontSize: 14, color: '#334155', lineHeight: 22 },

  contactCard: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  contactLabel: { fontSize: 11, fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: 0.4 },
  contactValue: { fontSize: 14, color: '#1E3A5F', fontWeight: '600', marginTop: 2 },

  attachSection: { width: '100%', marginBottom: 20 },
  attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  attachImage:  { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#fff' },
  attachHint:   { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  downloadBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: NAVY, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  downloadText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },

  viewerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewerClose: { position: 'absolute', top: 40, right: 20, padding: 8 },
  viewerImage: { width: '100%', height: '80%' },
});

export default JobPostingDetailScreen;
