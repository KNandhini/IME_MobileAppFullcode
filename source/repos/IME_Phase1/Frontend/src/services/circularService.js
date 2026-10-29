import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadAttachments as uploadLocalAttachments } from '../utils/uploadAttachments';

const getToken = async () => {
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    if (authToken) return authToken;
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
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);
  return data;
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

  create: async (data) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('publishDate', data.publishDate);
    if (data.description) form.append('description', data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);
    form.append('visibility', data.visibility || 'All');

    return multipartFetch('POST', '/circular', form);
  },

  update: async (circularId, data) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('publishDate', data.publishDate);
    if (data.description) form.append('description', data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);
    form.append('visibility', data.visibility || 'All');

    return multipartFetch('PUT', `/circular/${circularId}`, form);
  },

  uploadAttachments: async (circularId, files) =>
    uploadLocalAttachments(`${BASE_URL}/api/circular/${circularId}/attachments`, files),

  delete: async (circularId) => {
    const response = await api.delete(`/circular/${circularId}`);
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    debugger;
    const response = await api.delete(`/circular/attachment/${attachmentId}`);
    return response.data;
  },

  getAttachmentUrl: (attachmentId) => {
    return `${api.defaults.baseURL}/circular/attachment/${attachmentId}`;
  },
};