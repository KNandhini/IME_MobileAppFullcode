import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Card, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { activityService } from '../services/activityService';
import { fileService } from '../services/fileService';
import { pickImageFromGallery, pickDocument } from '../utils/imagePicker';

const ActivityFormScreen = ({ route, navigation }) => {
  const { activityId } = route.params || {};
  const isEditMode = !!activityId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activityDate: new Date(),
    venue: '',
    coordinator: '',
    registrationDeadline: new Date(),
    status: 'Upcoming',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      loadActivity();
    }
  }, [activityId]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const response = await activityService.getById(activityId);
      if (response.success) {
        setFormData({
          ...response.data,
          activityDate: new Date(response.data.activityDate),
          registrationDeadline: new Date(response.data.registrationDeadline),
        });
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
      Alert.alert('Error', 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectBanner = async () => {
    const image = await pickImageFromGallery();
    if (image) {
      setSelectedBanner(image);
    }
  };

  const handleSelectFiles = async () => {
    const docs = await pickDocument({ multiple: true });
    if (docs) {
      setSelectedFiles((prev) => [...prev, ...(Array.isArray(docs) ? docs : [docs])]);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter activity title');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter activity description');
      return;
    }

    if (!formData.venue.trim()) {
      Alert.alert('Error', 'Please enter venue');
      return;
    }

    setSaving(true);
    try {
      let response;
      if (isEditMode) {
        response = await activityService.update(activityId, formData);
      } else {
        response = await activityService.create(formData);
      }

      if (response.success) {
        const savedActivityId = response.data.activityId || activityId;

        // Upload banner if selected
        if (selectedBanner) {
          const file = {
            uri: selectedBanner.uri,
            type: 'image/jpeg',
            name: `banner_${savedActivityId}.jpg`,
          };
          await fileService.uploadFile(file, 'Activity', savedActivityId);
        }

        // Upload attachments
        for (const doc of selectedFiles) {
          const file = {
            uri: doc.uri,
            type: doc.mimeType || 'application/octet-stream',
            name: doc.name,
          };
          await fileService.uploadFile(file, 'Activity', savedActivityId);
        }

        Alert.alert(
          'Success',
          `Activity ${isEditMode ? 'updated' : 'created'} successfully`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to save activity');
      }
    } catch (error) {
      console.error('Save activity error:', error);
      Alert.alert('Error', 'Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Activity Details</Text>

          <TextInput
            label="Title *"
            value={formData.title}
            onChangeText={(text) => handleUpdateField('title', text)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => handleUpdateField('description', text)}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.input}
          />

          <TextInput
            label="Venue *"
            value={formData.venue}
            onChangeText={(text) => handleUpdateField('venue', text)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Coordinator"
            value={formData.coordinator}
            onChangeText={(text) => handleUpdateField('coordinator', text)}
            mode="outlined"
            style={styles.input}
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <TextInput
              label="Activity Date *"
              value={formData.activityDate.toLocaleDateString()}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="calendar" />}
              style={styles.input}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.activityDate}
              mode="date"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) handleUpdateField('activityDate', date);
              }}
            />
          )}

          <TouchableOpacity onPress={() => setShowDeadlinePicker(true)}>
            <TextInput
              label="Registration Deadline"
              value={formData.registrationDeadline.toLocaleDateString()}
              mode="outlined"
              editable={false}
              right={<TextInput.Icon icon="calendar" />}
              style={styles.input}
            />
          </TouchableOpacity>

          {showDeadlinePicker && (
            <DateTimePicker
              value={formData.registrationDeadline}
              mode="date"
              onChange={(event, date) => {
                setShowDeadlinePicker(false);
                if (date) handleUpdateField('registrationDeadline', date);
              }}
            />
          )}

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusOptions}>
            {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => (
              <Chip
                key={status}
                selected={formData.status === status}
                onPress={() => handleUpdateField('status', status)}
                style={styles.statusChip}
              >
                {status}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Media</Text>

          <Button
            mode="outlined"
            onPress={handleSelectBanner}
            icon="image"
            style={styles.uploadButton}
          >
            {selectedBanner ? 'Change Banner' : 'Select Banner Image'}
          </Button>

          {selectedBanner && (
            <Text style={styles.selectedText}>Selected: {selectedBanner.fileName || 'Image'}</Text>
          )}

          <Button
            mode="outlined"
            onPress={handleSelectFiles}
            icon="attachment"
            style={styles.uploadButton}
          >
            Add Attachments
          </Button>

          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Button onPress={() => handleRemoveFile(index)} icon="close">
                Remove
              </Button>
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          {isEditMode ? 'Update Activity' : 'Create Activity'}
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={saving}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  uploadButton: {
    marginBottom: 12,
  },
  selectedText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actions: {
    padding: 15,
  },
  saveButton: {
    paddingVertical: 6,
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 6,
  },
});

export default ActivityFormScreen;
