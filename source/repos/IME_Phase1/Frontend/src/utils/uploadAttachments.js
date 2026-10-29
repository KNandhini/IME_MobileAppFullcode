import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, UploadType } from 'expo-file-system';

export const uploadAttachments = async (url, files) => {
    const token = await AsyncStorage.getItem('authToken');
    const results = [];

    for (const file of files) {
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