import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reads the JWT from the parsed userData object in AsyncStorage
const getToken = async () => {
  const userData = await AsyncStorage.getItem('userData');
  if (!userData) return null;
  const parsed = JSON.parse(userData);
  return parsed?.token || parsed?.accessToken || null;
};

// For create/update with media — hits /api/achievements (NOT /api/file/...)
const multipartPost = async (url, formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${url}`, {   // ✅ was /api/file${url}
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

const multipartPut = async (url, formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${url}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

// For generic file uploads — hits /api/file/upload
const multipartFileUpload = async (formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/file/upload`, {  // ✅ explicit path
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

export const achievementService = {
  getAll: async () => {
    const response = await api.get('/achievements');
    return response.data;
  },

  getById: async (achievementId) => {
    const response = await api.get(`/achievements/${achievementId}`);
    return response.data;
  },

  // ✅ Hits POST /api/achievements  (multipart)
  createWithMedia: async (formData) => multipartPost('/achievements', formData),

  // ✅ Hits PUT /api/achievements/:id  (multipart)
  updateWithMedia: async (achievementId, formData) => multipartPut(`/achievements/${achievementId}`, formData),

  create: async (achievementData) => {
    const response = await api.post('/achievements', achievementData);
    return response.data;
  },

  update: async (achievementId, achievementData) => {
    const response = await api.put(`/achievements/${achievementId}`, achievementData);
    return response.data;
  },

  delete: async (achievementId) => {
    const response = await api.delete(`/achievements/${achievementId}`);
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    const response = await api.delete(`/achievements/attachment/${attachmentId}`);
    return response.data;
  },

  // ✅ Hits POST /api/file/upload  (separate file upload endpoint)
  uploadFile: async (formData) => multipartFileUpload(formData),

  // ── Same as supportService.getAttachmentUrl ───────────────────────────────
  // Builds a full image/file URL from attachmentId.
  // Use this in <Image source> and Linking.openURL — never use raw filePath.
  //
  // Flow:
  //   a.attachmentId = 42
  //   → "http://192.168.1.1:5000/api/file/attachment/42"
  //   → passed to <Image source={{ uri }}/> or Linking.openURL(uri)
  //
  getAttachmentUrl: (attachmentId) => {
    return `${BASE_URL}/api/file/attachment/${attachmentId}`;
  },
  getAttachments: async (achievementId) => {
  const token = await getToken();

  const response = await fetch(
    `${BASE_URL}/api/achievements/${achievementId}/attachments`,
    {
      method: 'GET',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json();
},
};