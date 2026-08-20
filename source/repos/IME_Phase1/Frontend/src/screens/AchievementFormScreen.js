import GradientHeader from '../components/GradientHeader';
import { COLORS } from './theme';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Image, Modal, Linking, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { memberService } from '../services/memberService';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../utils/api';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementFormScreenDrop as drop, AchievementFormScreenStyles as styles, AddCircularScreenStyles as circStyles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';
import DOBField from '../components/DOBField';

const NAVY = COLORS.primary;
const GOLD = COLORS.accent;

const API_BASE = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

// Attachment size cap — matches the "Max 50 MB each" hint shown to the user.
const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // 50 MB

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

const formatMB = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Resolve a picked asset's size in bytes, whichever field the picker
// happened to populate (DocumentPicker uses `size`, ImagePicker usually
// gives `fileSize`, but neither is guaranteed on every platform/version —
// fall back to asking the filesystem directly for the real size).
const getAssetSize = async (asset) => {
  if (typeof asset.size === 'number') return asset.size;
  if (typeof asset.fileSize === 'number') return asset.fileSize;
  try {
    const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
    if (info?.exists && typeof info.size === 'number') return info.size;
  } catch (e) {
    console.warn('Could not determine file size for', asset?.uri, e);
  }
  return null; // unknown — let it through rather than block a valid pick
};

// Splits picked assets into { accepted, rejected }, checking each one's
// real size against MAX_ATTACHMENT_BYTES.
const partitionBySize = async (assets) => {
  const accepted = [];
  const rejected = [];
  for (const asset of assets) {
    const size = await getAssetSize(asset);
    if (size != null && size > MAX_ATTACHMENT_BYTES) {
      rejected.push({ name: asset.fileName || asset.name || 'file', size });
    } else {
      accepted.push(asset);
    }
  }
  return { accepted, rejected };
};

const warnIfRejected = (rejected) => {
  if (rejected.length === 0) return;
  const list = rejected.map(r => `• ${r.name} (${formatMB(r.size)})`).join('\n');
  Alert.alert(
    'File too large',
    `The following file${rejected.length > 1 ? 's' : ''} exceed${rejected.length > 1 ? '' : 's'} the 50 MB limit and ${rejected.length > 1 ? 'were' : 'was'} not added:\n\n${list}`
  );
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
          ? <ActivityIndicator size="small" color={GOLD} style={{ marginRight: 8 }} />
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
  const [loading, setLoading] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [fileViewer, setFileViewer] = useState({ visible: false, uri: null });
  const [errors, setErrors] = useState({});

  // Bounds for the achievement date picker — wide past range, capped at
  // today (an achievement can't be dated in the future).
  const today = new Date();
  const dateMinDate = new Date(today.getFullYear() - 100, 0, 1);
  const dateMaxDate =  new Date(today.getFullYear() + 80, 11, 31);

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
            const { accepted, rejected } = await partitionBySize(result.assets);
            warnIfRejected(rejected);
            const picked = accepted.slice(0, slotsLeft).map(asset => ({
              uri: asset.uri, fileName: asset.name, mimeType: asset.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments(prev => [...prev, ...picked]);
          }
        },
      },
      {
        text: 'Image / Video',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, selectionLimit: slotsLeft, quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            // "Photo / Image" here can also return videos since
            // MediaTypeOptions.All is used — every asset gets size-checked.
            const { accepted, rejected } = await partitionBySize(result.assets);
            warnIfRejected(rejected);
            const picked = accepted.slice(0, slotsLeft).map(asset => ({
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
      debugger;
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
        // ── Cover every likely response shape so create-mode never loses the new id ──
        recordId =
          res?.data?.achievementId ??
          res?.data?.AchievementId ??
          res?.achievementId ??
          res?.AchievementId ??
          res?.data?.data?.achievementId ??
          res?.data?.data?.AchievementId ??
          res?.data?.id ??
          res?.id;
      }

      if (!res?.success) { Alert.alert('Error', getSafeErrorMessage(res)); return; }

      if (attachments.length > 0) {
        debugger;
        if (!recordId) {
          console.warn('No recordId resolved after save — attachments cannot be uploaded.');
          Alert.alert('Warning', 'Achievement was saved, but the attachment(s) could not be uploaded (no record id returned).');
        } else {
          let failedUploads = 0;
          for (const file of attachments) {
            try {
              debugger;
              const fd = new FormData();
              fd.append('file', { uri: file.uri, name: file.fileName, type: file.mimeType });
              fd.append('moduleName', 'Achievements');
              fd.append('recordId', String(recordId));
              const uploadRes = await achievementService.uploadFile(fd);
              if (uploadRes && uploadRes.success === false) {
                failedUploads++;
              }
            } catch (e) {
              failedUploads++;
              console.warn('Attachment upload failed:', e.message);
            }
          }
          if (failedUploads > 0) {
            Alert.alert('Note', `${failedUploads} of ${attachments.length} attachment(s) failed to upload.`);
          }
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
      <StatusBar backgroundColor={COLORS.headerStart} barStyle="light-content" />

      <GradientHeader style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEdit ? 'Edit Achievement' : 'Add Achievement'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={GOLD} />
            : <Text style={styles.saveText}>{isEdit ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </GradientHeader>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* ── Member avatar (shown for both roles) ── */}


        {/* ── Member field ── */}
        {!roleResolved ? (
          <View style={styles.roleLoadingRow}>
            <ActivityIndicator size="small" color={GOLD} />
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

        {/* ── Date picker — same dd/mm/yyyy typing + wheel-list picker used
             across the app (ActivityFormScreen's Activity Date) ── */}
        <DOBField
          label="Achievement Date"
          required
          value={date}
          minDate={dateMinDate}
          maxDate={dateMaxDate}
          error={errors.date}
          FieldComponent={Field}
          InputComponent={StyledInput}
          onChange={(d) => {
            setDate(d);
            if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
          }}
        />

        {/* ── Attachments — reuses AddCircularScreenStyles (circStyles) so the format is identical to AddCircularScreen ── */}
        <Text style={styles.attachLabel}>ATTACHMENTS</Text>
        <View style={circStyles.attachGrid}>
          {existingAttachments.map((a) => {
            const url = toPublicUrl(a.filePath);
            const isImage = a.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
              a.filePath?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
            return (
              <View key={`ex-${a.attachmentId}`} style={circStyles.thumb}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (isImage) setFileViewer({ visible: true, uri: url });
                    else Linking.openURL(url);
                  }}
                >
                  {isImage ? (
                    <Image source={{ uri: url }} style={circStyles.thumbImg} resizeMode="cover" />
                  ) : (
                    <View style={circStyles.thumbDoc}>
                      <Text style={circStyles.thumbIcon}>📄</Text>
                      <Text style={circStyles.thumbName} numberOfLines={2}>{a.fileName}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={circStyles.thumbRemove}
                  onPress={() => {
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
                  }}
                >
                  <Text style={circStyles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {attachments.map((a, i) => (
            <View key={`new-${i}`} style={circStyles.thumb}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  if (a.type === 'image') setFileViewer({ visible: true, uri: a.uri });
                  else Linking.openURL(a.uri);
                }}
              >
                {a.type === 'image' ? (
                  <Image source={{ uri: a.uri }} style={circStyles.thumbImg} resizeMode="cover" />
                ) : (
                  <View style={circStyles.thumbDoc}>
                    <Text style={circStyles.thumbIcon}>📄</Text>
                    <Text style={circStyles.thumbName} numberOfLines={2}>{a.fileName}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={circStyles.thumbRemove}
                onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
              >
                <Text style={circStyles.thumbRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {totalAttachments < 5 && (
            <TouchableOpacity style={circStyles.thumbAdd} onPress={handlePickAttachment} activeOpacity={0.8}>
              <Text style={circStyles.thumbAddIcon}>📷</Text>
              <Text style={circStyles.thumbAddText}>Add ({totalAttachments}/5)</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={circStyles.attachHint}>JPG, PNG, PDF, Word · Max 50 MB each</Text>

        {/* ── Save button ── 
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave} disabled={loading} activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <>
              <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>{isEdit ? 'Update Achievement' : 'Save Achievement'}</Text>
            </>
          }
        </TouchableOpacity>*/}

        </ScrollView>
      </KeyboardAvoidingView>

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