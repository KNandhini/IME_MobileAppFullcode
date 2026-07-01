// services/magazineService.js
import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const magazineService = {
  getAll: async () => {
    try {
      const response = await api.get('/Magazines');
      return response.data;
    } catch (error) {
      console.error('getAll magazines error:', error);
      return { success: false, message: error.message };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/Magazines/${id}`);
      return response.data;
    } catch (error) {
      console.error('getById magazine error:', error);
      return { success: false, message: error.message };
    }
  },

  // Use native fetch instead of axios — axios + FormData has reliability issues in React Native.
  createWithMedia: async (formData) => {
    const token = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${BASE_URL}/api/Magazines`, {
      method: 'POST',
      headers: {
        // Do NOT set Content-Type — fetch sets multipart/form-data with boundary automatically
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
      throw Object.assign(new Error(parsed?.message || `HTTP ${response.status}`), {
        response: { status: response.status, data: parsed },
      });
    }

    return response.json(); // { success, message, data: { magazineId } }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/Magazines/${id}`);
      return response.data;
    } catch (error) {
      console.error('delete magazine error:', error);
      return { success: false, message: error.message };
    }
  },

  getAttachments: async (id) => {
    try {
      const response = await api.get(`/Magazines/${id}/attachments`);
      return response.data;
    } catch (error) {
      console.error('getAttachments error:', error);
      return { success: false, message: error.message };
    }
  },

  // Use native fetch instead of axios — axios + FormData has reliability issues in React Native.
  uploadAttachments: async (id, formData) => {
    const token = await AsyncStorage.getItem('authToken');

    const response = await fetch(`${BASE_URL}/api/Magazines/${id}/attachments`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
      throw Object.assign(new Error(parsed?.message || `HTTP ${response.status}`), {
        response: { status: response.status, data: parsed },
      });
    }

    return response.json();
  },

  deleteAttachment: async (attachmentId) => {
    try {
      const response = await api.delete(`/Magazines/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('deleteAttachment error:', error);
      return { success: false, message: error.message };
    }
  },
  // Use native fetch instead of axios — axios + FormData has reliability issues in React Native.
updateWithMedia: async (id, formData) => {
    debugger;
  const token = await AsyncStorage.getItem('authToken');
debugger;
  const response = await fetch(`${BASE_URL}/api/Magazines/${id}`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
    throw Object.assign(new Error(parsed?.message || `HTTP ${response.status}`), {
      response: { status: response.status, data: parsed },
    });
  }

  return response.json();
},
// =========================================================
// Add these two functions inside your existing magazineService
// (same pattern as getAttachments — adjust axios/fetch base
// instance to match what magazineService already uses)
// =========================================================

getForumDiscussion: async (magazineId) => {
  try {
    const res = await api.get(`/Magazines/${magazineId}/discussion`);
    return res.data; // { success, data: [...] }
  } catch (e) {
    console.warn('getForumDiscussion error:', e);
    return { success: false, data: [] };
  }
},

addForumDiscussion: async ({ magazineId, memberId, memberName, comment }) => {
  try {
    debugger;
    const res = await api.post(`/Magazines/${magazineId}/discussion`, {
      magazineId,
      memberId,
      memberName,
      comment,
    });
    return res.data; // { success, data: insertedRow }
  } catch (e) {
    debugger;
    console.warn('addForumDiscussion error:', e);
    return { success: false };
  }
},
 
};