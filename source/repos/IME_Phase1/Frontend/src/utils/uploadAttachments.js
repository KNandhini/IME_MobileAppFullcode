import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, UploadType } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
export const uploadAttachments = async (url, files) => {
    const token = await AsyncStorage.getItem('authToken');
    const results = [];

    for (const file of files) {
        console.log('Selected attachment:', {
    uri: file.uri,
    name: file.fileName || file.name,
    mimeType: file.mimeType,
});

try {
    const info = await FileSystem.getInfoAsync(file.uri);

    console.log('Attachment file info:', info);

    if (!info.exists || info.isDirectory) {
        throw new Error(
            'Selected file is unavailable. Remove it and select it again.'
        );
    }
} catch (error) {
    console.warn('Cannot access attachment:', error.message);
    throw error;
}
        const response = await new File(file.uri).upload(url, {
            uploadType: UploadType.MULTIPART,
            fieldName: 'files',
            mimeType: file.mimeType || 'application/octet-stream',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        let data = {};
        try {
            data = JSON.parse(response.body);
        } catch {
            // Keep the HTTP status as the failure detail for non-JSON responses.
        }

        if (response.status < 200 || response.status >= 300 || data.success === false) {
            throw new Error(data.message || `Attachment upload failed (${response.status}).`);
        }

        results.push(data);
    }

    return results;
};