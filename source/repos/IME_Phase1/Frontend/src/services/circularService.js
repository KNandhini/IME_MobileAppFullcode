import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const circularService = {

  getAll: async () => {
    const response = await api.get('/circular');
    return response.data;
  },

  getById: async (circularId) => {
    const response = await api.get(`/circular/${circularId}`);
    return response.data;
  },

  create: async (data, attachments = []) => {
    const token = await AsyncStorage.getItem('authToken');
    const form  = new FormData();

    form.append('title',          data.title);
    form.append('publishDate',    data.publishDate);
    if (data.description)    form.append('description',    data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);

    attachments.forEach((file) => {
      const uri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;
      form.append('files', { uri, name: file.fileName || `attachment_${Date.now()}`, type: file.mimeType || 'application/octet-stream' });
    });

    const response = await fetch(`${BASE_URL}/api/circular`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    return response.json();
  },

  update: async (circularId, data, attachments = []) => {
    const token = await AsyncStorage.getItem('authToken');
    const form  = new FormData();

    form.append('title',          data.title);
    form.append('publishDate',    data.publishDate);
    if (data.description)    form.append('description',    data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);

    attachments.forEach((file) => {
      const uri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;
      form.append('files', { uri, name: file.fileName || `attachment_${Date.now()}`, type: file.mimeType || 'application/octet-stream' });
    });

    const response = await fetch(`${BASE_URL}/api/circular/${circularId}`, {
      method: 'PUT',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: form,
    });
    return response.json();
  },

  delete: async (circularId) => {
    const response = await api.delete(`/circular/${circularId}`);
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    const response = await api.delete(`/circular/attachment/${attachmentId}`);
    return response.data;
  },

  getAttachmentUrl: (attachmentId) => {
    return `${api.defaults.baseURL}/circular/attachment/${attachmentId}`;
  },
};
