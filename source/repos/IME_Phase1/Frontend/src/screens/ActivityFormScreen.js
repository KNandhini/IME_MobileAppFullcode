import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { TextInput, Button, Card, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { activityService } from '../services/activityService';
import { pickDocument } from '../utils/imagePicker';

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
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handlePickDocument = async () => {
    const result = await pickDocument();
    if (result.success) setSelectedFiles((prev) => [...prev, result.asset]);
  };

  const removeFile = (index) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

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
    <ScrollView style={styles.container}>
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
          <Button mode="outlined" onPress={handlePickDocument} style={styles.attachBtn} icon="paperclip">Add Document</Button>
          {selectedFiles.map((f, i) => (
            <View key={i} style={styles.fileRow}>
              <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
              <TouchableOpacity onPress={() => removeFile(i)}><Text style={styles.removeBtn}>✕</Text></TouchableOpacity>
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.btn}>
          {isEditMode ? 'Update Activity' : 'Create Activity'}
        </Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} disabled={saving} style={styles.btn}>Cancel</Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  attachBtn:       { marginBottom: 10 },
  fileRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  fileName:        { flex: 1, fontSize: 13, color: '#333' },
  removeBtn:       { color: '#E53E3E', fontSize: 16, paddingLeft: 8 },
  actions:         { padding: 12 },
  btn:             { marginBottom: 10 },
});

export default ActivityFormScreen;
