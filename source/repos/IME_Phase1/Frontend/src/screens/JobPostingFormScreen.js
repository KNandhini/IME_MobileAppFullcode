// Place in: src/screens/JobPostingFormScreen.js
// Mirrors AchievementFormScreen.js structure exactly.

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { jobPostingService } from '../services/jobpostingService';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobPostingFormScreenChip as chip, JobPostingFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const EMPLOYMENT_TYPES = ['Full Time', 'Contract', 'Part Time', 'Internship'];
const WORK_MODES       = ['Remote', 'Hybrid', 'Office'];

// ── Chip selector (Employment Type / Work Mode) ───────────────────────────────
function ChipSelector({ label, options, value, onChange }) {
  return (
    <View style={chip.wrapper}>
      <Text style={chip.label}>{label}</Text>
      <View style={chip.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[chip.chip, value === opt && chip.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[chip.chipText, value === opt && chip.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}



// ── JobPostingFormScreen ──────────────────────────────────────────────────────
const JobPostingFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEdit = !!item;
  const { user } = useAuth();

  const [currentUserName, setCurrentUserName] = useState('');
  const [currentClubId, setCurrentClubId]     = useState(null);

  // Form fields
  const [jobTitle,                 setJobTitle]                 = useState(item?.jobTitle || '');
  const [companyName,              setCompanyName]              = useState(item?.companyName || '');
  const [location,                 setLocation]                 = useState(item?.location || '');
  const [employmentType,           setEmploymentType]           = useState(item?.employmentType || EMPLOYMENT_TYPES[0]);
  const [workingHours,             setWorkingHours]             = useState(item?.workingHours || '');
  const [workMode,                 setWorkMode]                 = useState(item?.workMode || WORK_MODES[0]);
  const [aboutRole,                setAboutRole]                = useState(item?.aboutRole || '');
  const [requiredSkills,           setRequiredSkills]           = useState(item?.requiredSkillsExperience || '');
  const [contactInfo,              setContactInfo]              = useState(item?.contactInfo || '');
  const [salaryPackage,            setSalaryPackage]            = useState(item?.salaryPackage || '');
  const [closingDate,              setClosingDate]              = useState(
    item?.vacancyClosingDate ? new Date(item.vacancyClosingDate) : new Date()
  );
  const [showDate,    setShowDate]    = useState(false);
  const [loading,     setLoading]     = useState(false);

  // Attachments
  const [attachments,         setAttachments]         = useState([]);          // new (not yet uploaded)
  const [existingAttachments, setExistingAttachments] = useState([]);          // already on server
  const [fileViewer,          setFileViewer]          = useState({ visible: false, uri: null });

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const name   = parsed.fullName || parsed.name || user?.fullName || 'Admin';
        const clubId = parsed.clubId || null;
        setCurrentUserName(name);
        setCurrentClubId(clubId);
      } catch (e) {
        console.warn('Bootstrap error:', e);
      }
    };
    bootstrap();
  }, []);

  // ── Load existing attachments in edit mode ─────────────────────────────────
  useEffect(() => {
    if (isEdit && item?.jobPostingId) loadExistingAttachments();
  }, []);

  const loadExistingAttachments = async () => {
    try {
      const res = await jobPostingService.getAttachments(item.jobPostingId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };

  // ── Attachment picker (same UX as AchievementFormScreen) ──────────────────
  const handlePickAttachment = async () => {
    const totalUsed = existingAttachments.length + attachments.length;
    const slotsLeft = 5 - totalUsed;
    if (slotsLeft <= 0) {
      Alert.alert('Limit reached', 'Max 5 attachments per job posting.');
      return;
    }

    Alert.alert('Attach File', 'Choose file type', [
      {
        text: 'PDF / Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
            copyToCacheDirectory: true,
            multiple: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map((asset) => ({
              uri: asset.uri, fileName: asset.name,
              mimeType: asset.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments((prev) => [...prev, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Image',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            selectionLimit: slotsLeft,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map((asset) => ({
              uri: asset.uri,
              fileName: asset.fileName || `image_${Date.now()}.jpg`,
              mimeType: asset.mimeType || 'image/jpeg',
              type: 'image',
            }));
            setAttachments((prev) => [...prev, ...picked]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const formatDate = (d) => {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!jobTitle.trim())    { Alert.alert('Validation', 'Job Title is required.'); return; }
    if (!companyName.trim()) { Alert.alert('Validation', 'Company Name is required.'); return; }
    if (!location.trim())    { Alert.alert('Validation', 'Location is required.'); return; }
    if (!contactInfo.trim()) { Alert.alert('Validation', 'Contact info is required.'); return; }

    setLoading(true);
    try {
      const payload = {
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        location: location.trim(),
        employmentType,
        workingHours: workingHours.trim(),
        workMode,
        aboutRole: aboutRole.trim(),
        requiredSkillsExperience: requiredSkills.trim(),
        contactInfo: contactInfo.trim(),
        salaryPackage: salaryPackage.trim(),
        vacancyClosingDate: formatDate(closingDate),
      };

      let res;
      let recordId;

      if (isEdit) {
        res      = await jobPostingService.update(item.jobPostingId, { ...payload, modifiedBy: currentUserName });
        recordId = item.jobPostingId;
      } else {
        res      = await jobPostingService.create({
          ...payload,
          clubId: Number(currentClubId),
          createdBy: currentUserName,
        });
        recordId = res?.data?.jobPostingId ?? res?.data?.JobPostingId;
      }

      if (!res?.success) {
        Alert.alert('Error', getSafeErrorMessage(res));
        return;
      }

      // Upload new attachments one-by-one (same as AchievementFormScreen)
      for (const file of attachments) {
        try {
          const fd = new FormData();
          fd.append('files', { uri: file.uri, name: file.fileName, type: file.mimeType });
          await jobPostingService.uploadAttachments(recordId, fd);
        } catch (e) {
          console.warn('Attachment upload failed:', e.message);
        }
      }

      Alert.alert('Success', isEdit ? 'Job posting updated!' : 'Job posting added!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const totalAttachments = existingAttachments.length + attachments.length;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Job Posting' : 'Add Job Posting'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Fields ── */}
        <TextInput label="Job Title *" value={jobTitle} onChangeText={setJobTitle}
          mode="outlined" outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY} style={styles.input} />

        <TextInput label="Company Name *" value={companyName} onChangeText={setCompanyName}
          mode="outlined" outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY} style={styles.input} />

        <TextInput label="Location *" value={location} onChangeText={setLocation}
          mode="outlined" outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY} style={styles.input} />

        <ChipSelector label="Employment Type *" options={EMPLOYMENT_TYPES}
          value={employmentType} onChange={setEmploymentType} />

        <TextInput label="Working Hours" value={workingHours} onChangeText={setWorkingHours}
          mode="outlined" outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY}
          style={styles.input} placeholder="e.g. 9:00 AM – 6:00 PM" />

        <ChipSelector label="Work Mode *" options={WORK_MODES}
          value={workMode} onChange={setWorkMode} />

        <TextInput label="About the Role" value={aboutRole} onChangeText={setAboutRole}
          mode="outlined" multiline numberOfLines={4}
          outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY} style={styles.input} />

        <TextInput label="Required Skills & Experience" value={requiredSkills} onChangeText={setRequiredSkills}
          mode="outlined" multiline numberOfLines={4}
          outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY} style={styles.input} />

        <TextInput label="Salary Package" value={salaryPackage} onChangeText={setSalaryPackage}
          mode="outlined" outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY}
          style={styles.input} placeholder="e.g. 6–8 LPA" />

        <TextInput label="If Interested, Please Contact *" value={contactInfo} onChangeText={setContactInfo}
          mode="outlined" outlineColor="#BBDEFB" activeOutlineColor={NAVY} textColor={NAVY} style={styles.input} />

        {/* ── Vacancy Closing Date ── */}
        <TouchableOpacity style={styles.dateField} onPress={() => setShowDate(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="calendar-outline" size={20} color={NAVY} />
          <View style={styles.dateText}>
            <Text style={styles.dateLabelText}>Vacancy Closing Date</Text>
            <Text style={styles.dateValue}>
              {closingDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={closingDate} mode="date" display="default" minimumDate={new Date()}
            onChange={(evt, d) => { setShowDate(false); if (d) setClosingDate(d); }}
          />
        )}

        {/* ── Attachments (same grid as AchievementFormScreen) ── */}
        <Text style={styles.attachLabel}>ATTACHMENTS</Text>
        <View style={styles.attachGrid}>
          {existingAttachments.map((a) => {
            const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
              a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
            return (
              <View key={`ex-${a.attachmentId}`} style={styles.gridThumb}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                  if (isImage) setFileViewer({ visible: true, uri: a.filePath });
                  else Linking.openURL(a.filePath);
                }}>
                  {isImage ? (
                    <Image source={{ uri: a.filePath }} style={styles.gridImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.gridDoc}>
                      <Text style={styles.gridDocIcon}>📄</Text>
                      <Text style={styles.gridDocName} numberOfLines={2}>{a.fileName}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.gridRemove} onPress={() => {
                  Alert.alert('Delete', `Delete "${a.fileName}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                          await jobPostingService.deleteAttachment(a.attachmentId);
                          setExistingAttachments((prev) => prev.filter((x) => x.attachmentId !== a.attachmentId));
                        } catch { Alert.alert('Error', 'Failed to delete attachment.'); }
                      },
                    },
                  ]);
                }}>
                  <Text style={styles.gridRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {attachments.map((a, i) => (
            <View key={`new-${i}`} style={styles.gridThumb}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                if (a.type === 'image') setFileViewer({ visible: true, uri: a.uri });
                else Linking.openURL(a.uri);
              }}>
                {a.type === 'image' ? (
                  <Image source={{ uri: a.uri }} style={styles.gridImg} resizeMode="cover" />
                ) : (
                  <View style={styles.gridDoc}>
                    <Text style={styles.gridDocIcon}>📄</Text>
                    <Text style={styles.gridDocName} numberOfLines={2}>{a.fileName}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridRemove}
                onPress={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}>
                <Text style={styles.gridRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {totalAttachments < 5 && (
            <TouchableOpacity style={styles.gridAddBtn} onPress={handlePickAttachment} activeOpacity={0.8}>
              <Text style={styles.gridAddIcon}>📎</Text>
              <Text style={styles.gridAddText}>Add ({totalAttachments}/5)</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.attachHint}>JPG, PNG, PDF, Word · Max 50 MB each</Text>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave} disabled={loading} activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{isEdit ? 'Update Job Posting' : 'Post Job'}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Image viewer modal ── */}
      <Modal visible={fileViewer.visible} transparent animationType="fade"
        onRequestClose={() => setFileViewer({ visible: false, uri: null })}>
        <View style={styles.viewerOverlay}>
          <TouchableOpacity style={styles.viewerClose}
            onPress={() => setFileViewer({ visible: false, uri: null })}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {fileViewer.uri && (
            <Image source={{ uri: fileViewer.uri }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
};



export default JobPostingFormScreen;
