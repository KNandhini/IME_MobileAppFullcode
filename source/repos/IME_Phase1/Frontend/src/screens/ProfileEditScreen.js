import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button, Card, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memberService } from '../services/memberService';
import { fileService } from '../services/fileService';
import { pickImageFromCamera, pickImageFromGallery, showImagePickerOptions } from '../utils/imagePicker';

const ProfileEditScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    designation: '',
    department: '',
    photoPath: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setMemberId(user.memberId);

        const response = await memberService.getProfile(user.memberId);
        if (response.success) {
          setProfileData(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectPhoto = () => {
    showImagePickerOptions(
      () => handlePickImage('camera'),
      () => handlePickImage('gallery')
    );
  };

  const handlePickImage = async (source) => {
    const image = source === 'camera' 
      ? await pickImageFromCamera()
      : await pickImageFromGallery({ allowsEditing: true, aspect: [1, 1] });

    if (image) {
      setSelectedImage(image);
      await handleUploadPhoto(image);
    }
  };

  const handleUploadPhoto = async (image) => {
    setUploadingPhoto(true);
    try {
      const file = {
        uri: image.uri,
        type: 'image/jpeg',
        name: `profile_${memberId}.jpg`,
      };

      const response = await fileService.uploadProfilePhoto(file, memberId);
      if (response.success) {
        setProfileData((prev) => ({ ...prev, photoPath: response.data.filePath }));
        Alert.alert('Success', 'Profile photo updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload photo error:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!profileData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!profileData.phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setSaving(true);
    try {
      const response = await memberService.updateProfile(memberId, profileData);
      if (response.success) {
        // Update stored user info
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.fullName = profileData.fullName;
          user.photoPath = profileData.photoPath;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }

        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={handleSelectPhoto} disabled={uploadingPhoto}>
          <View style={styles.photoContainer}>
            {selectedImage?.uri || profileData.photoPath ? (
              <Image
                source={{ uri: selectedImage?.uri || profileData.photoPath }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <TextInput
            label="Full Name *"
            value={profileData.fullName}
            onChangeText={(text) => handleUpdateField('fullName', text)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email *"
            value={profileData.email}
            editable={false}
            mode="outlined"
            style={styles.input}
            disabled
          />

          <TextInput
            label="Phone Number *"
            value={profileData.phoneNumber}
            onChangeText={(text) => handleUpdateField('phoneNumber', text)}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />

          <TextInput
            label="Designation"
            value={profileData.designation}
            onChangeText={(text) => handleUpdateField('designation', text)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Department"
            value={profileData.department}
            onChangeText={(text) => handleUpdateField('department', text)}
            mode="outlined"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Address Information</Text>

          <TextInput
            label="Address"
            value={profileData.address}
            onChangeText={(text) => handleUpdateField('address', text)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <TextInput
            label="City"
            value={profileData.city}
            onChangeText={(text) => handleUpdateField('city', text)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="State"
            value={profileData.state}
            onChangeText={(text) => handleUpdateField('state', text)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Pincode"
            value={profileData.pincode}
            onChangeText={(text) => handleUpdateField('pincode', text)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        >
          Save Changes
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 10,
    color: '#2196F3',
    fontSize: 14,
  },
  card: {
    margin: 15,
    marginTop: 0,
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

export default ProfileEditScreen;
