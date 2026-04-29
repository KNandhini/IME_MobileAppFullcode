import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Image,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { achievementService } from '../services/achievementService';
import { useAuth } from '../context/AuthContext';

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';

const AchievementFormScreen = ({ route, navigation }) => {
  const { item } = route.params || {};          // present when editing
  const isEdit   = !!item;
  const { user } = useAuth();

  const [title,       setTitle]       = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [date,        setDate]        = useState(item?.achievementDate ? new Date(item.achievementDate) : new Date());
  const [showDate,    setShowDate]    = useState(false);
  const [photo,       setPhoto]       = useState(null);        // { uri }
  const [attachment,  setAttachment]  = useState(null);        // { uri, name, mimeType }
  const [loading,     setLoading]     = useState(false);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.75,
    });
    if (!res.canceled && res.assets?.length) setPhoto(res.assets[0]);
  };

  const pickAttachment = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets?.[0] || res;
      setAttachment({ uri: file.uri, name: file.name || 'attachment', mimeType: file.mimeType || 'application/octet-stream' });
    } catch (e) {
      Alert.alert('Error', 'Could not pick file.');
    }
  };

  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Validation', 'Title is required.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title',           title.trim());
      formData.append('description',     description.trim());
      formData.append('achievementDate', formatDate(date));
      formData.append('memberName',      user?.fullName || user?.name || 'Member');

      if (photo) {
        formData.append('photo', {
          uri:  photo.uri,
          name: 'achievement_photo.jpg',
          type: 'image/jpeg',
        });
      }
      if (attachment) {
        formData.append('attachment', {
          uri:  attachment.uri,
          name: attachment.name,
          type: attachment.mimeType,
        });
      }

      let res;
      if (isEdit) {
        res = await achievementService.updateWithMedia(item.achievementId, formData);
      } else {
        res = await achievementService.createWithMedia(formData);
      }

      if (res?.success) {
        Alert.alert('Success', isEdit ? 'Achievement updated!' : 'Achievement added!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res?.message || 'Failed to save achievement.');
      }
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Achievement' : 'Add Achievement'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

        {/* Photo picker */}
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.85}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons name="camera-plus-outline" size={32} color={GOLD} />
              <Text style={styles.photoHint}>Add your photo (optional)</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <TextInput
          label="Achievement Title *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          outlineColor="#BBDEFB"
          activeOutlineColor={NAVY}
          style={styles.input}
        />

        {/* Description */}
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

        {/* Date picker */}
        <TouchableOpacity style={styles.dateField} onPress={() => setShowDate(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="calendar-outline" size={20} color={NAVY} />
          <View style={styles.dateText}>
            <Text style={styles.dateLabelText}>Achievement Date</Text>
            <Text style={styles.dateValue}>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>
        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(evt, d) => { setShowDate(false); if (d) setDate(d); }}
          />
        )}

        {/* Attachment picker */}
        <TouchableOpacity style={styles.attachPicker} onPress={pickAttachment} activeOpacity={0.85}>
          <MaterialCommunityIcons name="paperclip" size={20} color={NAVY} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.attachPickerTitle}>
              {attachment ? attachment.name : 'Add Attachment (optional)'}
            </Text>
            <Text style={styles.attachPickerHint}>PDF, Word, or Image</Text>
          </View>
          {attachment
            ? <MaterialCommunityIcons name="check-circle" size={20} color="#22C55E" />
            : <MaterialCommunityIcons name="plus-circle-outline" size={20} color={GOLD} />
          }
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>{isEdit ? 'Update Achievement' : 'Save Achievement'}</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingTop: (StatusBar.currentHeight || 0) + 6,
    paddingBottom: 12, paddingHorizontal: 12,
  },
  headerBtn:   { padding: 6, borderRadius: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700' },

  body: { padding: 18, paddingBottom: 40 },

  photoPicker: {
    alignSelf: 'center', marginBottom: 20,
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: GOLD, borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPreview:     { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoHint:        { fontSize: 9, color: GOLD, marginTop: 4, textAlign: 'center' },

  input: { marginBottom: 14, backgroundColor: '#fff' },

  dateField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 14, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  dateText:      { flex: 1, marginLeft: 10 },
  dateLabelText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  dateValue:     { fontSize: 14, color: NAVY, fontWeight: '600', marginTop: 2 },

  attachPicker: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    marginBottom: 22, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  attachPickerTitle: { fontSize: 13, color: NAVY, fontWeight: '600' },
  attachPickerHint:  { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: NAVY, borderRadius: 12, padding: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});

export default AchievementFormScreen;
