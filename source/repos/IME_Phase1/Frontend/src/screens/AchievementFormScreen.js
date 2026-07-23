import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking, TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { memberService } from '../services/memberService';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementFormScreenDrop as drop, AchievementFormScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

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

const blobToDataUri = (blob) => {
  if (!blob) return null;
  if (blob.startsWith('data:')) return blob;
  return `data:image/jpeg;base64,${blob}`;
};

// ── Field wrapper — local styles.field (own copy, matches Admin Signup / Activity Form) ──
function Field({ label, required, children, error, hint, charCount, maxChars }) {
  const over = maxChars != null && charCount > maxChars;
  return (
    <View style={styles.field.wrapper}>
      <View style={styles.field.labelRow}>
        <Text style={styles.field.label}>
          {label}{required && <Text style={styles.field.req}> *</Text>}
        </Text>
        {maxChars != null && (
          <Text style={[styles.field.counter, over && styles.field.counterOver]}>
            {charCount ?? 0}/{maxChars}
          </Text>
        )}
      </View>
      {children}
      {!!hint && !error && <Text style={styles.field.hint}>{hint}</Text>}
      {!!error && <Text style={styles.field.error}>{error}</Text>}
    </View>
  );
}

// ── Styled TextInput — local styles.styledInput (own copy, matches Admin Signup / Activity Form) ──
function StyledInput({ hasError, multiline, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      style={[
        styles.styledInput.base,
        multiline && styles.styledInput.multiline,
        focused && styles.styledInput.focused,
        hasError && styles.styledInput.errored,
        style,
      ]}
      placeholderTextColor="#CBD5E1"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

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



// ── AchievementFormScreen ─────────────────────────────────────────────────────
const AchievementFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const isEdit = !!item;
  const { user } = useAuth();

  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentClubId, setCurrentClubId] = useState(null);
  const [roleResolved, setRoleResolved] = useState(false);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [memberPhotoUri, setMemberPhotoUri] = useState(null);
  const [memberImgError, setMemberImgError] = useState(false);

  // Seed from item immediately so edit shows value on frame 1
  const [selectedMemberId, setSelectedMemberId] = useState(item?.memberId || null);
  const [selectedMemberName, setSelectedMemberName] = useState(item?.memberName || '');

  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  // ── Date: no default — user must pick. Edit mode still seeds from item. ──
  const [date, setDate] = useState(item?.achievementDate ? new Date(item.achievementDate) : null);
  const [showDate, setShowDate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });
  const [errors, setErrors] = useState({});
  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const raw = await AsyncStorage.getItem('userData');
        if (!raw) return;
        const parsed = JSON.parse(raw);

        const role = (parsed.roleName || parsed.role || '').trim();
        const userId = parsed.userId || parsed.memberId || null;
        const clubId = parsed.clubId || null;

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
          const name = item?.memberName || parsed.fullName || parsed.name || user?.fullName || 'Member';
          const memberId = item?.memberId || userId;

          setSelectedMemberName(name);
          setSelectedMemberId(memberId);

          // Photo from AsyncStorage
          const photo = parsed.profilePhoto || parsed.photo || null;
          if (photo) {
            setMemberPhotoUri(blobToDataUri(photo));
          } else if (parsed.memberPhotoPath || parsed.profilePhotoPath) {
            setMemberPhotoUri(toPublicUrl(parsed.memberPhotoPath || parsed.profilePhotoPath));
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
          label: m.fullName ?? '',
          value: m.memberId,
          // ProfilePhotoPath only — no blob
          photoUri: m.profilePhotoPath
            ? toPublicUrl(m.profilePhotoPath)
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

    // Clear validation error
    setErrors(prev => ({
      ...prev,
      member: '',
    }));
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
    // Title validation
    console.log("selectedMemberId =", selectedMemberId);
    const validationErrors = {};

    if (!title.trim()) {
      validationErrors.title = 'Achievement title is required';
    }

    if (userRole === 'Admin' && !selectedMemberId) {
      validationErrors.member = 'Please select a member';
    }

    if (!date) {
      validationErrors.date = 'Please select achievement date';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const effectiveMemberId = userRole === "Admin" ? selectedMemberId : currentUserId;
    const effectiveMemberName = selectedMemberName;

    if (!effectiveMemberId) {
      Alert.alert("Error", "Could not determine member. Please try again.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('achievementDate', formatDate(date));
      formData.append('memberName', effectiveMemberName);
      formData.append('memberId', parseInt(effectiveMemberId, 10));

      let res;
      let recordId;

      if (isEdit) {
        res = await achievementService.updateWithMedia(item.achievementId, formData);
        recordId = item.achievementId;
      } else {
        res = await achievementService.createWithMedia(formData);
        recordId = res?.data?.achievementId ?? res?.data?.AchievementId;
      }

      if (!res?.success) { Alert.alert('Error', getSafeErrorMessage(res)); return; }

      for (const file of attachments) {
        try {
          const fd = new FormData();
          fd.append('file', { uri: file.uri, name: file.fileName, type: file.mimeType });
          fd.append('moduleName', 'Achievements');
          fd.append('recordId', String(recordId));
          await achievementService.uploadFile(fd);
        } catch (e) {
          console.warn('Attachment upload failed:', e.message);
        }
      }

      Alert.alert('Success', isEdit ? 'Achievement updated!' : 'Achievement added!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', getSafeErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const totalAttachments = existingAttachments.length + attachments.length;
  const showPhoto = memberPhotoUri && !memberImgError;

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEdit ? 'Edit Achievement' : 'Add Achievement'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
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
            label="Person Name *"
            options={members}
            value={selectedMemberId}
            onChange={handleMemberChange}
            placeholder="Select person name"
            loading={membersLoading}
            error={errors.member}
          />
        ) : (
          <Field label="Member Name">
            <StyledInput value={selectedMemberName} editable={false} />
          </Field>
        )}

        {/* ── Title ── */}
        <Field label="Achievement Title" required error={errors.title}>
          <StyledInput
            placeholder="Enter Achievement Title"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors(prev => ({ ...prev, title: '' }));
            }}
            hasError={!!errors.title}
          />
        </Field>

        {/* ── Description ── */}
        <Field label="Description">
          <StyledInput
            placeholder="Enter Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </Field>

        {/* ── Date picker — styled like Title, no default value ── */}
        <Field label="Achievement Date" required error={errors.date}>
          <TouchableOpacity
            style={[
              styles.styledInput.base,
              !!errors.date && styles.styledInput.errored,
            ]}
            onPress={() => setShowDate(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={date ? { fontSize: 15, color: '#1E293B', fontWeight: '500' } : { fontSize: 15, color: '#CBD5E1', fontWeight: '500' }}>
                {date
                  ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Select achievement date'}
              </Text>
              <MaterialCommunityIcons name="calendar-outline" size={18} color={date ? NAVY : '#94A3B8'} />
            </View>
          </TouchableOpacity>
        </Field>
        {showDate && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(evt, d) => {
              setShowDate(false);
              if (d) {
                setDate(d);
                setErrors(prev => ({ ...prev, date: '' }));
              }
            }}
          />
        )}

        {/* ── Attachments ── */}
        <Text style={styles.attachLabel}>ATTACHMENTS</Text>
        <View style={styles.attachGrid}>
          {existingAttachments.map((a) => {
            const url = toPublicUrl(a.filePath);
            const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
              a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
            return (
              <View key={`ex-${a.attachmentId}`} style={styles.gridThumb}>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                  if (isImage) setFileViewer({ visible: true, uri: url });
                  else Linking.openURL(url);
                }}>
                  {isImage ? (
                    <Image source={{ uri: url }} style={styles.gridImg} resizeMode="cover" />
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
                          await achievementService.deleteAttachment(a.attachmentId);
                          setExistingAttachments(prev => prev.filter(x => x.attachmentId !== a.attachmentId));
                        } catch { Alert.alert('Error', 'Failed to delete'); }
                      }
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

        {/* ── Save button ── 
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
        </TouchableOpacity>*/}

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


export default AchievementFormScreen;