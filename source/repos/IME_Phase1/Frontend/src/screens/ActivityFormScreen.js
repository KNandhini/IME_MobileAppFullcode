import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform,
  StatusBar, ActivityIndicator, KeyboardAvoidingView, Image, Linking,
} from 'react-native';
import { TextInput, Card, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { activityService } from '../services/activityService';

const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const formatDate = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const DateField = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.dateInput} onPress={() => setShow(true)}>
        <Text style={styles.dateLabel}>{label}</Text>
        <View style={styles.dateValueRow}>
          <Text style={value ? styles.dateText : styles.datePlaceholder}>
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
  const [formData, setFormData] = useState({
    title: '', description: '', venue: '', coordinator: '',
    status: 'Upcoming',
  });
  const [activityDate, setActivityDate] = useState(null);
  const [registrationDeadline, setRegistrationDeadline] = useState(null);

  useEffect(() => {
    if (isEditMode) loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    try {
      const res = await activityService.getById(activityId);
      if (res.success && res.data) {
        const d = res.data;
        setFormData({
          title: d.title || '',
          description: d.description || '',
          venue: d.venue || '',
          coordinator: d.coordinator || '',
          status: d.status || 'Upcoming',
        });
        if (d.activityDate) setActivityDate(new Date(d.activityDate));
        if (d.registrationDeadline) setRegistrationDeadline(new Date(d.registrationDeadline));
      }
    } catch (e) { console.error('Load activity error:', e); }
  };

  const update = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handlePickAttachment = async () => {
    if (attachments.length >= 5) { Alert.alert('Limit reached', 'Max 5 attachments.'); return; }
    const slots = 5 - attachments.length;

    Alert.alert('Attach File', 'Choose file type', [
      {
        text: 'PDF / Document',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword',
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            copyToCacheDirectory: true,
            multiple: true,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slots).map(a => ({
              uri: a.uri, fileName: a.name, mimeType: a.mimeType || 'application/pdf', type: 'document',
            }));
            setAttachments(p => [...p, ...picked]);
          }
        },
      },
      {
        text: 'Photo / Video',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            selectionLimit: slots,
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.length > 0) {
            const picked = result.assets.slice(0, slots).map(a => ({
              uri: a.uri, fileName: a.fileName || `media_${Date.now()}`,
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

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.venue.trim()) {
      Alert.alert('Error', 'Title, description and venue are required.');
      return;
    }
    if (!activityDate) {
      Alert.alert('Error', 'Activity date is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        activityDate: activityDate.toISOString(),
        registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : null,
      };
      const res = isEditMode
        ? await activityService.update(activityId, payload)
        : await activityService.create(payload);

      if (res.success) {
        Alert.alert('Success', isEditMode ? 'Activity updated.' : 'Activity created.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else { Alert.alert('Error', res.message || 'Operation failed.'); }
    } catch (e) { Alert.alert('Error', 'An error occurred.'); }
    finally { setSaving(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1E3A5F' }}>
      {/* ── Top navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navSide} disabled={saving}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{isEditMode ? 'Edit Activity' : 'Add Activity'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.navSide} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color="#D4A017" />
            : <Text style={styles.navSave}>{isEditMode ? 'Update' : 'Save'}</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Activity Details</Text>
              <TextInput label="Title *" value={formData.title} onChangeText={(v) => update('title', v)} mode="outlined" style={styles.input} />
              <TextInput label="Description *" value={formData.description} onChangeText={(v) => update('description', v)} mode="outlined" multiline numberOfLines={4} style={styles.input} />
              <TextInput label="Venue *" value={formData.venue} onChangeText={(v) => update('venue', v)} mode="outlined" style={styles.input} />
              <TextInput label="Coordinator" value={formData.coordinator} onChangeText={(v) => update('coordinator', v)} mode="outlined" style={styles.input} />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <DateField label="Activity Date *" value={activityDate} onChange={setActivityDate} />
              <DateField label="Registration Deadline" value={registrationDeadline} onChange={setRegistrationDeadline} />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity key={s} onPress={() => update('status', s)}>
                    <Chip selected={formData.status === s} style={[styles.chip, formData.status === s && styles.chipSelected]}
                      textStyle={formData.status === s ? { color: '#fff' } : {}}>{s}</Chip>
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Attachments (Optional)</Text>
              <View style={styles.attachGrid}>
                {attachments.map((a, i) => (
                  <View key={i} style={styles.thumb}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => openFile(a.uri, a.type)}>
                      {a.type === 'image' ? (
                        <Image source={{ uri: a.uri }} style={styles.thumbImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.thumbDoc}>
                          <Text style={styles.thumbIcon}>{a.type === 'video' ? '🎬' : '📄'}</Text>
                          <Text style={styles.thumbName} numberOfLines={2}>{a.fileName}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.thumbRemove} onPress={() => setAttachments(p => p.filter((_, idx) => idx !== i))}>
                      <Text style={styles.thumbRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {attachments.length < 5 && (
                  <TouchableOpacity style={styles.thumbAdd} onPress={handlePickAttachment} activeOpacity={0.8}>
                    <Text style={styles.thumbAddIcon}>📷</Text>
                    <Text style={styles.thumbAddText}>Add ({attachments.length}/5)</Text>
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

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    paddingTop: (StatusBar.currentHeight ?? 0) + 12,
    backgroundColor: '#1E3A5F',
  },
  navSide:   { minWidth: 72, paddingHorizontal: 4 },
  navTitle:  { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  navCancel: { fontSize: 15, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  navSave:   { fontSize: 15, color: '#D4A017', fontWeight: '700', textAlign: 'right' },

  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  card:            { margin: 12, elevation: 2 },
  sectionTitle:    { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input:           { marginBottom: 10, backgroundColor: '#fff' },
  dateInput:       { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  dateLabel:       { fontSize: 12, color: '#555', marginBottom: 4 },
  dateValueRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText:        { fontSize: 15, color: '#333' },
  datePlaceholder: { fontSize: 15, color: '#aaa' },
  calendarIcon:    { fontSize: 18 },
  statusRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:            { marginRight: 8, marginBottom: 8 },
  chipSelected:    { backgroundColor: '#1E3A5F' },

  attachGrid:      { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 12, borderStyle: 'dashed', padding: 8, minHeight: 80, alignItems: 'center', marginTop: 4 },
  thumb:           { width: 80, height: 80, borderRadius: 10, margin: 4, overflow: 'hidden', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  thumbImg:        { width: '100%', height: '100%' },
  thumbDoc:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  thumbIcon:       { fontSize: 24 },
  thumbName:       { fontSize: 9, color: '#64748B', textAlign: 'center', marginTop: 2 },
  thumbRemove:     { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  thumbRemoveText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  thumbAdd:        { width: 80, height: 80, borderRadius: 10, margin: 4, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  thumbAddIcon:    { fontSize: 22, marginBottom: 2 },
  thumbAddText:    { fontSize: 9, color: '#64748B', textAlign: 'center', fontWeight: '500' },
  attachHint:      { fontSize: 11, color: '#94A3B8', marginTop: 6 },
});

export default ActivityFormScreen;
