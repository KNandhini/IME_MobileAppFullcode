import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

export const requestCameraPermission = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos.'
      );
      return false;
    }
  }
  return true;
};

export const requestMediaLibraryPermission = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library permission is required to select photos.'
      );
      return false;
    }
  }
  return true;
};

export const pickImageFromCamera = async () => {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Camera error:', error);
    Alert.alert('Error', 'Failed to take photo');
    return null;
  }
};

export const pickImageFromGallery = async (options = {}) => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing !== false,
      aspect: options.aspect || [4, 3],
      quality: options.quality || 0.8,
      allowsMultipleSelection: options.multiple || false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return options.multiple ? result.assets : result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Gallery error:', error);
    Alert.alert('Error', 'Failed to select photo');
    return null;
  }
};

export const pickDocument = async (options = {}) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: options.type || '*/*',
      multiple: options.multiple || false,
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return options.multiple ? result.assets : result.assets[0];
    }
    return null;
  } catch (error) {
    console.error('Document picker error:', error);
    Alert.alert('Error', 'Failed to select document');
    return null;
  }
};

export const showImagePickerOptions = (onCamera, onGallery) => {
  Alert.alert(
    'Select Photo',
    'Choose photo source',
    [
      {
        text: 'Camera',
        onPress: onCamera,
      },
      {
        text: 'Gallery',
        onPress: onGallery,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ],
    { cancelable: true }
  );
};

// Helper to convert image to FormData for upload
export const createImageFormData = (image, fieldName = 'file') => {
  const formData = new FormData();
  const filename = image.uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append(fieldName, {
    uri: image.uri,
    name: filename,
    type,
  });

  return formData;
};

// Helper to create document FormData
export const createDocumentFormData = (document, fieldName = 'file') => {
  const formData = new FormData();
  
  formData.append(fieldName, {
    uri: document.uri,
    name: document.name,
    type: document.mimeType || 'application/octet-stream',
  });

  return formData;
};
