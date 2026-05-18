import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
  try {
    const raw = await AsyncStorage.getItem('userData');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? parsed?.Token ?? null;
  } catch {
    return null;
  }
};

const multipartFetch = async (method, url, form) => {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}/api${url}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // NO Content-Type — fetch sets multipart/form-data + boundary automatically
    },
    body: form,
  });
  return response.json();
};

export const circularService = {

  getAll: async () => {
    const response = await api.get('/circular');
    return response.data;
  },

  getByClub: async () => {
    const response = await api.get('/circular/my-club');
    return response.data;
  },

  getById: async (circularId) => {
    const response = await api.get(`/circular/${circularId}`);
    return response.data;
  },

  create: async (data, attachments = []) => {
    const form = new FormData();
    form.append('title',       data.title);
    form.append('publishDate', data.publishDate);
    if (data.description)    form.append('description',    data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);
    form.append('visibility',  data.visibility || 'All');

    attachments.forEach((file) => {
      form.append('files', {
        uri:  file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`,
        name: file.fileName || file.name || `file_${Date.now()}.jpg`,
        type: file.mimeType || file.type || 'application/octet-stream',
      });
    });

    return multipartFetch('POST', '/circular', form);
  },

  update: async (circularId, data, attachments = []) => {
    const form = new FormData();
    form.append('title',       data.title);
    form.append('publishDate', data.publishDate);
    if (data.description)    form.append('description',    data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);
    form.append('visibility',  data.visibility || 'All');

    attachments.forEach((file) => {
      form.append('files', {
        uri:  file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`,
        name: file.fileName || file.name || `file_${Date.now()}.jpg`,
        type: file.mimeType || file.type || 'application/octet-stream',
      });
    });

    return multipartFetch('PUT', `/circular/${circularId}`, form);
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