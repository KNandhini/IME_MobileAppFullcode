import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Platform, StatusBar, ActivityIndicator, KeyboardAvoidingView, Image, Linking } from 'react-native';
import { TextInput, Card, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activityService } from '../services/activityService';
import { BASE_URL } from '../utils/api';
import { ActivityFormScreenStyles as styles } from './screenStyles';

// ─── Build a displayable URL from a stored FilePath ───────────────────────
// Mirrors buildPhotoUrl in AchievementFormScreen — handles backslashes from
// Windows-style paths and avoids double-prefixing already-absolute URLs.
const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return `${BASE_URL}/Uploads/${filePath.replace(/\\/g, '/').replace(/^Uploads\/?/i, '')}`;
};

// Decide how to render an attachment based on its FileType/FileName.
const getAttachmentKind = (fileTypeOrName = "") => {
  const v = fileTypeOrName.toLowerCase();
  if (v.includes("image") || /\.(jpg|jpeg|png|gif|webp)$/.test(v)) return "image";
  if (v.includes("video") || /\.(mp4|mov|avi|mkv)$/.test(v)) return "video";
  return "document";
};
const NAVY = '#1E3A5F';
const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const VISIBILITY_OPTIONS = [
  { value: 'Public(All Clubs)', label: 'Public', sub: 'All Clubs' },
  { value: 'Private(This Club Only)', label: 'Private', sub: 'This Club Only' },
];

const formatDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Local date-only string — avoids the UTC-shift-by-one-day bug that
// `.toISOString()` causes for date-only fields like ActivityDate.
const toDateOnlyString = (date) => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00`;
};

const DateField = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[
          styles.dateInput,
          { borderColor: '#BBDEFB' }
        ]}
        onPress={() => setShow(true)}
      >
        <Text style={[styles.dateLabel, { color: '#64748B' }]}>
          {label}
        </Text>
        <View style={styles.dateValueRow}>
          <Text
            style={
              value
                ? [styles.dateText, { color: '#1E3A5F' }]
                : [styles.datePlaceholder, { color: '#94A3B8' }]
            }
          >
            {value ? formatDate(value) : 'Select date'}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </View>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            setShow(Platform.OS === 'ios');
            if (date) onChange(date);
          }}
        />
      )}
    </>
  );
};

const ActivityFormScreen = ({ route, navigation }) => {
  const { activityId } = route.params || {};
  const isEditMode = !!activityId;

  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);

  const [formData, setFormData] = useState({
    activityName: '',
    description: '',
    venue: '',
    coordinator: '',
    chiefGuest: '',
    time: '',
    status: 'Upcoming',
    visibility: 'Public(All Clubs)',
  });
  const [activityDate, setActivityDate] = useState(null);
  const [registrationDeadline, setRegistrationDeadline] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      loadActivity();
      loadAttachments();
    }
  }, [activityId]);

  // ── Delete an existing (server-side) attachment ───────────────────────────
  const deleteExisting = (attachmentId, fileName) => {
    Alert.alert('Delete', `Delete "${fileName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await activityService.deleteAttachment(attachmentId);
            setExistingAttachments(p => p.filter(a => a.attachmentId !== attachmentId));
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  // ── Load existing attachments via activityService (mirrors AchievementFormScreen) ──
  const loadAttachments = async () => {
    try {
      const res = await activityService.getAttachments(activityId);
      if (res?.data) setExistingAttachments(res.data);
    } catch (e) {
      console.warn('Load attachments error:', e);
    }
  };

  const loadActivity = async () => {
    try {
      const res = await activityService.getById(activityId);
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          activityName: d.activityName || '',
          description: d.description || '',
          venue: d.venue || '',
          coordinator: d.coordinator || '',
          chiefGuest: d.chiefGuest || '',
          time: d.time || '',
          status: d.status || 'Upcoming',
          visibility: d.visibility || 'Public(All Clubs)',
        });
        if (d.activityDate) setActivityDate(new Date(d.activityDate));
        if (d.registrationDeadline) setRegistrationDeadline(new Date(d.registrationDeadline));
      }
    } catch (e) {
      console.error('Load activity error:', e);
    }
  };

  const update = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handlePickAttachment = async () => {
    const totalCount = existingAttachments.length + attachments.length;
    if (totalCount >= 5) { Alert.alert('Limit reached', 'Max 5 attachments.'); return; }
    const slots = 5 - totalCount;

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
            const picked = result.assets.slice(0, slots).map(a => ({
              uri: a.uri,
              fileName: a.name,
              mimeType: a.mimeType || 'application/pdf',
              type: 'document',
            }));
            setAttachments(p => [...p, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Video',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo library access.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            selectionLimit: slots,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slots).map(a => ({
              uri: a.uri,
              fileName: a.fileName || `media_${Date.now()}`,
              mimeType: a.mimeType || (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
              type: a.type === 'video' ? 'video' : 'image',
            }));
            setAttachments(p => [...p, ...picked]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openFile = (uri, type) => {
    if (type === 'image') return;
    Linking.openURL(uri).catch(() => Alert.alert('Error', 'Cannot open this file.'));
  };

  // ── Upload new attachments via multipart fetch ────────────────────────────
  const uploadAttachments = async (id) => {
    if (attachments.length === 0) return;

    const formDataBody = new FormData();
    attachments.forEach(file => {
      formDataBody.append("files", {
        uri: Platform.OS === "android"
          ? file.uri
          : file.uri.replace("file://", ""),
        name: file.fileName,
        type: file.mimeType,
      });
    });

    const token = await AsyncStorage.getItem("authToken");

    const response = await fetch(
      `${BASE_URL}/api/Activity/${id}/attachments`,
      {
        method: "POST",
        // Do NOT set Content-Type manually — fetch sets the multipart boundary itself
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formDataBody,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    return response.json().catch(() => ({}));
  };

  const handleSave = async () => {
    if (
      !formData.activityName.trim() ||
      !formData.description.trim() ||
      !formData.venue.trim()
    ) {
      Alert.alert('Error', 'Activity name, description and venue are required.');
      return;
    }
    if (!activityDate) {
      Alert.alert('Error', 'Activity date is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        activityName: formData.activityName,
        description: formData.description,
        venue: formData.venue,
        time: formData.time,
        chiefGuest: formData.chiefGuest,
        coordinator: formData.coordinator,
        status: formData.status,
        visibility: formData.visibility,
        activityDate: toDateOnlyString(activityDate),
        registrationDeadline: toDateOnlyString(registrationDeadline),
      };

      const res = isEditMode
        ? await activityService.update(activityId, payload)
        : await activityService.create(payload);

      if (!res.success) {
        Alert.alert('Error', res.message || 'Operation failed.');
        setSaving(false);
        return;
      }

      // Resolve the id to upload attachments against:
      // - edit mode: we already know activityId
      // - create mode: pull the new id out of whatever shape the API returned
      const newActivityId = isEditMode
        ? activityId
        : (res.data?.activityId ?? res.data?.id ?? res.data);

      if (attachments.length > 0 && newActivityId) {
        try {
          await uploadAttachments(newActivityId);
        } catch (uploadErr) {
          console.warn('Attachment upload error:', uploadErr?.message ?? uploadErr);
          Alert.alert(
            'Partial Success',
            (isEditMode ? 'Activity updated' : 'Activity created') +
            ', but some attachments failed to upload.\nYou can retry from the edit screen.'
          );
          setSaving(false);
          navigation.goBack();
          return;
        }
      }

      Alert.alert('Success', isEditMode ? 'Activity updated.' : 'Activity created.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1E3A5F' }}>
      {/* ── Top navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navSide}
          disabled={saving}
        >
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEditMode ? 'Edit Activity' : 'Add Activity'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#D4A017" />
            : <Text style={styles.navSave}>{isEditMode ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>

          {/* ── Activity Details ── */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Activity Details</Text>
              <TextInput
                label="Title *"
                value={formData.activityName}
                onChangeText={(v) => update('activityName', v)}
                mode="outlined"
                textColor="#1E3A5F"
                outlineColor="#BBDEFB"
                activeOutlineColor={NAVY}
                style={styles.input}
              />
              <TextInput
                label="Description *"
                value={formData.description}
                onChangeText={(v) => update('description', v)}
                mode="outlined"
                multiline
                numberOfLines={4}
                textColor="#1E3A5F"
                outlineColor="#BBDEFB"
                activeOutlineColor={NAVY}
                style={styles.input}
              />
              <TextInput
                label="Venue *"
                value={formData.venue}
                onChangeText={(v) => update('venue', v)}
                mode="outlined"
                style={styles.input}
                textColor="#1E3A5F"
                outlineColor="#BBDEFB"
                activeOutlineColor={NAVY}
              />
              <TextInput
                label="Coordinator"
                value={formData.coordinator}
                onChangeText={(v) => update('coordinator', v)}
                mode="outlined"
                style={styles.input}
                textColor="#1E3A5F"
                outlineColor="#BBDEFB"
                activeOutlineColor={NAVY}
              />
              <TextInput
                label="Chief Guest"
                value={formData.chiefGuest}
                onChangeText={(v) => update('chiefGuest', v)}
                mode="outlined"
                style={styles.input}
                textColor="#1E3A5F"
                outlineColor="#BBDEFB"
                activeOutlineColor={NAVY}
              />
              <TextInput
                label="Time (e.g. 10:00 AM)"
                value={formData.time}
                onChangeText={(v) => update('time', v)}
                mode="outlined"
                style={styles.input}
                placeholder="e.g. 10:00 AM"
                textColor="#1E3A5F"
                outlineColor="#BBDEFB"
                activeOutlineColor={NAVY}
              />
            </Card.Content>
          </Card>

          {/* ── Date & Time ── */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <DateField
                label="Activity Date *"
                value={activityDate}
                onChange={setActivityDate}

              />
              <DateField
                label="Registration Deadline"
                value={registrationDeadline}
                onChange={setRegistrationDeadline}
              />
            </Card.Content>
          </Card>

          {/* ── Status ── */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity key={s} onPress={() => update('status', s)}>
                    <Chip
                      selected={formData.status === s}
                      style={[styles.chip, formData.status === s && styles.chipSelected]}
                      textStyle={formData.status === s ? { color: '#fff' } : {}}
                    >
                      {s}
                    </Chip>
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* ── Visibility ── */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Visibility</Text>
              <View style={styles.radioGroup}>
                {VISIBILITY_OPTIONS.map((opt) => {
                  const selected = formData.visibility === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.radioOption, selected && styles.radioOptionSelected]}
                      onPress={() => update('visibility', opt.value)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.radioTextWrap}>
                        <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                          {opt.label}
                        </Text>
                        <Text style={[styles.radioSub, selected && styles.radioSubSelected]}>
                          {opt.sub}
                        </Text>
                      </View>
                      <Text style={styles.radioIcon}>
                        {opt.value === 'Public(All Clubs)' ? '🌐' : '🔒'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card.Content>
          </Card>

          {/* ── Attachments ── */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Attachments (Optional)</Text>
              <View style={styles.attachGrid}>

                {/* Existing (server) attachments */}
                {existingAttachments.map((a) => {
                  const kind = getAttachmentKind(a.fileType || a.fileName);
                  const url = buildFileUrl(a.filePath);
                  return (
                    <View key={`ex-${a.attachmentId}`} style={styles.thumb}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => {
                          if (kind !== 'image') {
                            Linking.openURL(url).catch(() =>
                              Alert.alert('Error', 'Cannot open this file.')
                            );
                          }
                        }}
                      >
                        {kind === 'image' ? (
                          <Image
                            source={{ uri: url }}
                            style={styles.thumbImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.thumbDoc}>
                            <Text style={styles.thumbIcon}>
                              {kind === 'video' ? '🎬' : '📄'}
                            </Text>
                            <Text style={styles.thumbName} numberOfLines={2}>
                              {a.fileName}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.thumbRemove}
                        onPress={() => deleteExisting(a.attachmentId, a.fileName)}
                      >
                        <Text style={styles.thumbRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* New, not-yet-uploaded attachments */}
                {attachments.map((a, i) => (
                  <View key={`new-${i}`} style={styles.thumb}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => openFile(a.uri, a.type)}
                    >
                      {a.type === 'image' ? (
                        <Image
                          source={{ uri: a.uri }}
                          style={styles.thumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.thumbDoc}>
                          <Text style={styles.thumbIcon}>
                            {a.type === 'video' ? '🎬' : '📄'}
                          </Text>
                          <Text style={styles.thumbName} numberOfLines={2}>
                            {a.fileName}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.thumbRemove}
                      onPress={() => setAttachments(p => p.filter((_, idx) => idx !== i))}
                    >
                      <Text style={styles.thumbRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {(existingAttachments.length + attachments.length) < 5 && (
                  <TouchableOpacity
                    style={styles.thumbAdd}
                    onPress={handlePickAttachment}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.thumbAddIcon}>📷</Text>
                    <Text style={styles.thumbAddText}>
                      Add ({existingAttachments.length + attachments.length}/5)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.attachHint}>JPG, PNG, PDF, DOC, MP4 · Max 50 MB each</Text>
            </Card.Content>
          </Card>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};



export default ActivityFormScreen;