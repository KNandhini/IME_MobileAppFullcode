// services/supportService.js
import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
//const BASE_URL = 'http://10.0.2.2:51150/api';

export const supportService = {

  getCategories: async () => {
    const res = await api.get('/support/categories');
    return res.data;
  },

  getByCategory: async (categoryId) => {
    const res = await api.get(`/support/category/${categoryId}`);
    return res.data;
  },

  create: async (formData, attachments = []) => {
    debugger;
  const token = await AsyncStorage.getItem('authToken');

  const form = new FormData();

  const safeAppend = (key, value) => {
    if (!value) return;
    form.append(key, String(value));
  };

  safeAppend('categoryId', formData.categoryId);
  safeAppend('personName', formData.personName);
  safeAppend('title', formData.title);
  safeAppend('description', formData.description);
  safeAppend('supportDate', formData.supportDate);
  safeAppend('companyOrIndividual', formData.companyOrIndividual);
  safeAppend('companyName', formData.companyName);
  safeAppend('amount', formData.amount);
  safeAppend('createdBy', formData.createdBy);

  attachments.forEach((file) => {
    const uri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;

    form.append('files', {
      uri,
      name: file.fileName || `attachment_${Date.now()}.jpg`,
      type: file.mimeType || 'image/jpeg',
    });
  });
debugger;
  const response = await fetch(`${BASE_URL}/api/support`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  return response.json();
},

/*update: async (supportId, formData, attachments = []) => {
  const form = new FormData();
debugger;
  const safeAppend = (key, value) => {
    if (value === null || value === undefined || value === 'null' || value === '') return;
    form.append(key, String(value));
  };

  safeAppend('categoryId',          formData.categoryId);
  safeAppend('personName',          formData.personName);
  safeAppend('title',               formData.title);
  safeAppend('description',         formData.description);
  safeAppend('supportDate',         formData.supportDate);
  safeAppend('companyOrIndividual', formData.companyOrIndividual);
  safeAppend('companyName',         formData.companyName);
  safeAppend('amount',              formData.amount);
  // ⚠️ No createdBy on update

  attachments.forEach((file) => {
    form.append('files', {
      uri:  file.uri,
      name: file.fileName || `attachment_${Date.now()}`,
      type: file.mimeType || 'application/octet-stream',
    });
  });

  // ✅ Always explicitly set multipart header
  const res = await api.put(`/support/${supportId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
},*/
update: async (supportId, formData, attachments = []) => {
  debugger;
  const token = await AsyncStorage.getItem('authToken');

  const form = new FormData();

  const safeAppend = (key, value) => {
    if (value === null || value === undefined || value === 'null' || value === '') return;
    form.append(key, String(value));
  };

  safeAppend('categoryId', formData.categoryId);
  safeAppend('personName', formData.personName);
  safeAppend('title', formData.title);
  safeAppend('description', formData.description);
  safeAppend('supportDate', formData.supportDate);
  safeAppend('companyOrIndividual', formData.companyOrIndividual);
  safeAppend('companyName', formData.companyName);
  safeAppend('amount', formData.amount);

  attachments.forEach((file) => {
    const uri = file.uri.startsWith('file://') ? file.uri : `file://${file.uri}`;

    form.append('files', {
      uri,
      name: file.fileName || `attachment_${Date.now()}.jpg`,
      type: file.mimeType || 'image/jpeg',
    });
  });

  const response = await fetch(`${BASE_URL}/api/support/${supportId}`, {
    method: 'PUT',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // ❌ DO NOT set Content-Type
    },
    body: form,
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

  delete: async (supportId) => {
    const res = await api.delete(`/support/${supportId}`);
    return res.data;
  },

  deleteAttachment: async (attachmentId) => {
    const res = await api.delete(`/support/attachment/${attachmentId}`);
    return res.data;
  },

  // Returns the URL to display/download an attachment
  getAttachmentUrl: (attachmentId) => {
    return `${api.defaults.baseURL}/support/attachment/${attachmentId}`;
  },
  getById: async (supportId) => {
  const res = await api.get(`/support/${supportId}`);
  return res.data;
},
};