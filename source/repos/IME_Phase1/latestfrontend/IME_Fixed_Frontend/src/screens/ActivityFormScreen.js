import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, Chip } from 'react-native-paper';
import { activityService } from '../services/activityService';
import { pickImageFromGallery, pickDocument } from '../utils/imagePicker';

const STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const ActivityFormScreen = ({ route, navigation }) => {
  const { activityId } = route.params || {};
  const isEditMode = !!activityId;
  const [saving, setSaving]       = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '', description: '', venue: '', coordinator: '',
    status: 'Upcoming',
    activityDate: '',           // YYYY-MM-DD HH:MM
    registrationDeadline: '',
  });

  useEffect(() => {
    if (isEditMode) { loadActivity(); }
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
          activityDate: d.activityDate ? d.activityDate.slice(0, 16) : '',
          registrationDeadline: d.registrationDeadline ? d.registrationDeadline.slice(0, 16) : '',
        });
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
    setSaving(true);
    try {
      const payload = {
        ...formData,
        activityDate: formData.activityDate ? new Date(formData.activityDate).toISOString() : new Date().toISOString(),
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : null,
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
          <Text style={styles.hint}>Format: YYYY-MM-DD HH:MM (e.g. 2025-06-15 10:00)</Text>
          <TextInput label="Activity Date *" value={formData.activityDate} onChangeText={(v) => update('activityDate', v)} mode="outlined" placeholder="2025-06-15 10:00" style={styles.input} />
          <TextInput label="Registration Deadline" value={formData.registrationDeadline} onChangeText={(v) => update('registrationDeadline', v)} mode="outlined" placeholder="2025-06-10 23:59" style={styles.input} />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card:   { margin: 12, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  hint:   { fontSize: 12, color: '#888', marginBottom: 8 },
  input:  { marginBottom: 10, backgroundColor: '#fff' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:   { marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#1E3A5F' },
  attachBtn: { marginBottom: 10 },
  fileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  fileName: { flex: 1, fontSize: 13, color: '#333' },
  removeBtn: { color: '#E53E3E', fontSize: 16, paddingLeft: 8 },
  actions: { padding: 12 },
  btn: { marginBottom: 10 },
});

export default ActivityFormScreen;
