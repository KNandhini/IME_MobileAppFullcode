import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Image, Modal, Linking,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { memberService } from '../services/memberService';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const buildPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;
  return `${BASE_URL}/Uploads/${photoPath.replace(/\\/g, '/').replace(/^Uploads\/?/i, '')}`;
};

const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

// ── Simple Dropdown ───────────────────────────────────────────────────────────
function SimpleDropdown({ label, options, value, onChange, placeholder = 'Select…', loading, error }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={drop.wrapper}>
      <Text style={drop.label}>{label}</Text>
      <TouchableOpacity
        style={[drop.trigger, !!error && drop.triggerError]}
        onPress={() => !loading && setOpen(true)}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator size="small" color={NAVY} style={{ marginRight: 8 }} />
          : null}
        <Text style={[drop.triggerText, !selected && drop.placeholder]}>
          {loading ? 'Loading…' : selected ? selected.label : placeholder}
        </Text>
        <Text style={drop.chevron}>▼</Text>
      </TouchableOpacity>
      {!!error && <Text style={drop.errorText}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={drop.overlay} onPress={() => setOpen(false)} />
        <View style={drop.sheet}>
          <View style={drop.sheetHeader}>
            <Text style={drop.sheetTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={drop.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {options.map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[drop.option, opt.value === value && drop.optionActive]}
                onPress={() => { onChange(opt.value); setOpen(false); }}
              >
                {/* Show photo in dropdown */}
                <View style={drop.optionRow}>
                  {opt.photoUri ? (
                    <Image source={{ uri: opt.photoUri }} style={drop.optionPhoto} />
                  ) : (
                    <View style={drop.optionPhotoPlaceholder}>
                      <Text style={drop.optionInitials}>
                        {opt.label.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={[drop.optionText, opt.value === value && drop.optionTextActive]}>
                    {opt.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const drop = StyleSheet.create({
  wrapper          : { marginBottom: 14 },
  label            : { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  trigger          : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#BBDEFB' },
  triggerError     : { borderColor: '#EF4444' },
  triggerText      : { flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '500' },
  placeholder      : { color: '#CBD5E1' },
  chevron          : { fontSize: 10, color: '#94A3B8', marginLeft: 8 },
  errorText        : { fontSize: 11, color: '#EF4444', marginTop: 4 },
  overlay          : { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet            : { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', paddingBottom: 30 },
  sheetHeader      : { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitle       : { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sheetClose       : { fontSize: 18, color: '#94A3B8', fontWeight: '700' },
  option           : { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  optionActive     : { backgroundColor: '#EFF6FF' },
  optionRow        : { flexDirection: 'row', alignItems: 'center' },
  optionPhoto      : { width: 36, height: 36, borderRadius: 18, marginRight: 12, borderWidth: 1.5, borderColor: GOLD },
  optionPhotoPlaceholder: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  optionInitials   : { color: '#fff', fontSize: 12, fontWeight: '700' },
  optionText       : { fontSize: 15, color: '#334155', flex: 1 },
  optionTextActive : { color: '#1D4ED8', fontWeight: '600' },
});

// ── AchievementFormScreen ─────────────────────────────────────────────────────
const AchievementFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEdit   = !!item;
  const { user } = useAuth();

  const [userRole,      setUserRole]      = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentClubId, setCurrentClubId] = useState(null);
  const [roleResolved,  setRoleResolved]  = useState(false);

  const [members,        setMembers]        = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [memberPhotoUri, setMemberPhotoUri] = useState(null);
  const [memberImgError, setMemberImgError] = useState(false);

  // Seed from item immediately so edit shows value on frame 1
  const [selectedMemberId,   setSelectedMemberId]   = useState(item?.memberId   || null);
  const [selectedMemberName, setSelectedMemberName] = useState(item?.memberName || '');

  const [title,       setTitle]       = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [date,        setDate]        = useState(item?.achievementDate ? new Date(item.achievementDate) : new Date());
  const [showDate,    setShowDate]    = useState(false);
  const [loading,     setLoading]     = useState(false);

  const [attachments,         setAttachments]         = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer,          setFileViewer]          = useState({ visible: false, uri: null });

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        if (!raw) return;
        const parsed = JSON.parse(raw);

        const role   = (parsed.roleName || parsed.role || '').trim();
        const userId = parsed.userId   || parsed.memberId || null;
        const clubId = parsed.clubId   || null;

        // Normalize role casing
        const normalizedRole = role.toLowerCase() === 'admin' ? 'Admin' : 'Member';

        setUserRole(normalizedRole);
        setCurrentUserId(userId);
        setCurrentClubId(clubId);

        if (normalizedRole === 'Admin') {
          // ── Admin: load club members via by-club endpoint ──
          await loadMembersForClub(clubId);
        } else {
          // ── Member: bind from item (edit) or own profile ──
          const name     = item?.memberName || parsed.fullName || parsed.name || user?.fullName || 'Member';
          const memberId = item?.memberId   || userId;

          setSelectedMemberName(name);
          setSelectedMemberId(memberId);

          // Photo from AsyncStorage
          const photo = parsed.profilePhoto || parsed.photo || null;
          if (photo) {
            setMemberPhotoUri(blobToDataUri(photo));
          } else if (parsed.memberPhotoPath || parsed.profilePhotoPath) {
            setMemberPhotoUri(buildPhotoUrl(parsed.memberPhotoPath || parsed.profilePhotoPath));
          }
        }
      } catch (e) {
        console.warn('Bootstrap error:', e);
      } finally {
        setRoleResolved(true);
      }
    };
    bootstrap();
  }, []);

  // ── Load existing attachments ─────────────────────────────────────────────
  useEffect(() => {
    if (isEdit && item?.achievementId) loadExistingAttachments();
  }, []);

  const loadExistingAttachments = async () => {
    try {
      const res = await achievementService.getAttachments(item.achievementId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };

  // ── Pre-select member in Admin edit mode once list is ready ───────────────
  useEffect(() => {
    if (isEdit && item && members.length > 0) {
      const match = members.find(
        (m) => m.value === item.memberId || m.label === item.memberName
      );
      if (match) {
        setSelectedMemberId(match.value);
        setSelectedMemberName(match.label);
        if (match.photoUri) {
          setMemberPhotoUri(match.photoUri);
          setMemberImgError(false);
        }
      }
    }
  }, [members, isEdit, item]);

  // ── Load members by club — uses by-club endpoint (no blob) ───────────────
  const loadMembersForClub = async (clubId) => {
    if (!clubId) return;
    setMembersLoading(true);
    try {
      // ✅ Use by-club endpoint — fast, no blob
      const res = await memberService.getMembersByClub(clubId, 1, 200);
      if (res?.success) {
        const list = (res.data ?? []).map((m) => ({
          label   : m.fullName ?? '',
          value   : m.memberId,
          // ProfilePhotoPath only — no blob
          photoUri: m.profilePhotoPath
            ? buildPhotoUrl(m.profilePhotoPath)
            : null,
        }));
        setMembers(list);
      }
    } catch (e) {
      console.error('Load members error:', e);
    } finally {
      setMembersLoading(false);
    }
  };

  // ── Admin picks a member ──────────────────────────────────────────────────
  const handleMemberChange = (memberId) => {
    const found = members.find((m) => m.value === memberId);
    if (!found) return;
    setSelectedMemberId(memberId);
    setSelectedMemberName(found.label);
    setMemberImgError(false);
    setMemberPhotoUri(found.photoUri || null);
  };

  // ── Attachment picker ─────────────────────────────────────────────────────
  const handlePickAttachment = async () => {
    const totalUsed = existingAttachments.length + attachments.length;
    const slotsLeft = 5 - totalUsed;
    if (slotsLeft <= 0) { Alert.alert('Limit reached', 'Max 5 attachments per achievement.'); return; }
    Alert.alert('Attach File', 'Choose file type', [
      {
        text: 'PDF / Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            copyToCacheDirectory: true, multiple: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map(asset => ({
              uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments(prev => [...prev, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Image',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, selectionLimit: slotsLeft, quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slotsLeft).map(asset => ({
              uri: asset.uri, fileName: asset.fileName || `image_${Date.now()}.jpg`, mimeType: asset.mimeType || 'image/jpeg', type: 'image',
            }));
            setAttachments(prev => [...prev, ...picked]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'M';

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    debugger;
    if (!title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }

    const effectiveMemberId   = selectedMemberId   || currentUserId;
    const effectiveMemberName = selectedMemberName || '';

    if (!effectiveMemberId) { Alert.alert('Validation', 'Member could not be determined.'); return; }

    setLoading(true);
    try {
      debugger;
      const formData = new FormData();
      formData.append('title',           title.trim());
      formData.append('description',     description.trim());
      formData.append('achievementDate', formatDate(date));
      formData.append('memberName',      effectiveMemberName);
      formData.append('memberId',        parseInt(effectiveMemberId));

      let res;
      let recordId;

      if (isEdit) {
        res      = await achievementService.updateWithMedia(item.achievementId, formData);
        recordId = item.achievementId;
      } else {
        debugger;
        res      = await achievementService.createWithMedia(formData);
        recordId = res?.data?.achievementId ?? res?.data?.AchievementId;
      }

      if (!res?.success) { Alert.alert('Error', res?.message || 'Failed to save achievement.'); return; }

      for (const file of attachments) {
        try {
          const fd = new FormData();
          fd.append('file',       { uri: file.uri, name: file.fileName, type: file.mimeType });
          fd.append('moduleName', 'Achievements');
          fd.append('recordId',   String(recordId));
          await achievementService.uploadFile(fd);
        } catch (e) {
          console.warn('Attachment upload failed:', e.message);
        }
      }

      Alert.alert('Success', isEdit ? 'Achievement updated!' : 'Achievement added!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const totalAttachments = existingAttachments.length + attachments.length;
  const showPhoto = memberPhotoUri && !memberImgError;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Achievement' : 'Add Achievement'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Member avatar (shown for both roles) ── */}
      
        {/* ── Member field ── */}
        {!roleResolved ? (
          <View style={styles.roleLoadingRow}>
            <ActivityIndicator size="small" color={NAVY} />
            <Text style={styles.roleLoadingText}>Loading…</Text>
          </View>
        ) : userRole === 'Admin' ? (
          <SimpleDropdown
            label="Member *"
            options={members}
            value={selectedMemberId}
            onChange={handleMemberChange}
            placeholder="Select member…"
            loading={membersLoading}
          />
        ) : (
          <TextInput
            label="Member Name"
            value={selectedMemberName}
            mode="outlined"
            editable={false}
            outlineColor="#BBDEFB"
            activeOutlineColor={NAVY}
            style={[styles.input, styles.inputReadOnly]}
            theme={{ colors: { onSurfaceDisabled: '#1E293B' } }}
          />
        )}

        {/* ── Title ── */}
        <TextInput
          label="Achievement Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
        />

        {/* ── Description ── */}
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
        />

        {/* ── Date picker ── */}
        <TouchableOpacity style={styles.dateField} onPress={() => setShowDate(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="calendar-outline" size={20} color={NAVY} />
          <View style={styles.dateText}>
            <Text style={styles.dateLabelText}>Achievement Date</Text>
            <Text style={styles.dateValue}>
              {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={date} mode="date" display="default" maximumDate={new Date()}
            onChange={(evt, d) => { setShowDate(false); if (d) setDate(d); }}
          />
        )}

        {/* ── Attachments ── */}
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
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        await achievementService.deleteAttachment(a.attachmentId);
                        setExistingAttachments(prev => prev.filter(x => x.attachmentId !== a.attachmentId));
                      } catch { Alert.alert('Error', 'Failed to delete'); }
                    }},
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
                onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                <Text style={styles.gridRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {totalAttachments < 5 && (
            <TouchableOpacity style={styles.gridAddBtn} onPress={handlePickAttachment} activeOpacity={0.8}>
              <Text style={styles.gridAddIcon}>📷</Text>
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
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Achievement' : 'Save Achievement'}</Text>
              </>
          }
        </TouchableOpacity>

      </ScrollView>

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12, paddingHorizontal: 12,
  },
  headerBtn:   { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },
  body: { padding: 18, paddingBottom: 40 },

  roleLoadingRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingVertical: 14 },
  roleLoadingText: { marginLeft: 8, fontSize: 14, color: '#94A3B8' },

  avatarBlock: { alignItems: 'center', marginBottom: 16 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2.5, borderColor: GOLD },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: NAVY,
    borderWidth: 2.5, borderColor: GOLD, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { color: '#fff', fontSize: 26, fontWeight: '800' },

  input:         { marginBottom: 14, backgroundColor: '#fff' },
  inputReadOnly: { marginBottom: 14, backgroundColor: '#F1F5F9' },

  dateField: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, padding: 14, marginBottom: 20, elevation: 1,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  dateText:      { flex: 1, marginLeft: 10 },
  dateLabelText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  dateValue:     { fontSize: 14, color: NAVY, fontWeight: '600', marginTop: 2 },

  attachLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.6 },
  attachGrid: {
    flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1',
    borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80,
    alignItems: 'center', marginBottom: 6,
  },
  gridThumb: {
    width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden',
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  gridImg:        { width: '100%', height: '100%' },
  gridDoc:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  gridDocIcon:    { fontSize: 24 },
  gridDocName:    { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
  gridRemove: {
    position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  gridRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  gridAddBtn: {
    width: 80, height: 80, borderRadius: 10, margin: 4,
    borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
  },
  gridAddIcon: { fontSize: 22, marginBottom: 2 },
  gridAddText: { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
  attachHint:  { fontSize: 11, color: '#94A3B8', marginBottom: 20 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: NAVY, borderRadius: 12, padding: 16, marginTop: 6,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },

  viewerOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  viewerImage:     { width: '100%', height: '80%' },
  viewerClose:     { position: 'absolute', top: 48, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

export default AchievementFormScreen;