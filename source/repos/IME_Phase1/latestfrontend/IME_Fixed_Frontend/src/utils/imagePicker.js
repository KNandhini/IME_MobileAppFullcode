import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export const pickImageFromGallery = async (options = {}) => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return { success: false, message: 'Gallery permission denied.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: options.aspect || [4, 3],
    quality: options.quality || 0.8,
  });

  if (result.canceled) return { success: false, message: 'Cancelled.' };

  return { success: true, asset: result.assets[0] };
};

export const pickImageFromCamera = async (options = {}) => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return { success: false, message: 'Camera permission denied.' };
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: options.aspect || [4, 3],
    quality: options.quality || 0.8,
  });

  if (result.canceled) return { success: false, message: 'Cancelled.' };

  return { success: true, asset: result.assets[0] };
};

export const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { success: false, message: 'Cancelled.' };

  return { success: true, asset: result.assets[0] };
};
