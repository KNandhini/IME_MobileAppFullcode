// Place in: src/screens/JobPostingDetailScreen.js
// Mirrors AchievementDetailScreen.js structure exactly.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Linking, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jobPostingService } from '../services/jobpostingService';
import { JobPostingDetailScreenStyles as styles } from './screenStyles';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

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
        <View style={styles.heroSection}>
          <View style={styles.heroIconCircle}>
            <Text style={{ fontSize: 38 }}>💼</Text>
          </View>
        </View>

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
              return isImage(filePath) ? (
                <TouchableOpacity
                  key={attachment.attachmentId || index}
                  onPress={() => setImgViewer(filePath)}
                  activeOpacity={0.85}
                  style={{ marginBottom: 14 }}
                >
                  <Image
                    source={{ uri: filePath }}
                    style={styles.attachImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.attachHint}>Tap to enlarge</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  key={attachment.attachmentId || index}
                  style={styles.downloadBtn}
                  onPress={() => Linking.openURL(filePath)}
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



export default JobPostingDetailScreen;
