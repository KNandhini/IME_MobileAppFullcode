// Place in: src/services/jobPostingService.js
// Mirrors achievementService.js pattern exactly.

import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getToken = async () => {
  const authToken = await AsyncStorage.getItem('authToken');
  if (authToken) return authToken;

  const userData = await AsyncStorage.getItem('userData');
  if (!userData) return null;
  const parsed = JSON.parse(userData);
  return parsed?.token || parsed?.accessToken || null;
};

// multipart POST — hits /api/jobpostings
const multipartPost = async (url, formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${url}`, {
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

// multipart PUT — hits /api/jobpostings/:id
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

// Generic file upload — hits /api/file/upload (same as achievements)
const multipartAttachmentUpload = async (jobPostingId, formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/jobpostings/${jobPostingId}/attachments`, {
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

export const jobPostingService = {
  // ── GET all job postings for a club ──────────────────────
  getAll: async (clubId) => {
    const response = await api.get(`/jobpostings?clubId=${clubId}`);
    return response.data;
  },

  // ── GET single job posting ────────────────────────────────
  getById: async (jobPostingId) => {
    const response = await api.get(`/jobpostings/${jobPostingId}`);
    return response.data;
  },

  // ── CREATE (multipart/form-data) ──────────────────────────
  createWithMedia: async (formData) => {
    return multipartPost('/jobpostings', formData);
  },

  create: async (jobPostingData) => {
    const response = await api.post('/jobpostings', jobPostingData);
    return response.data;
  },

  // ── UPDATE (multipart/form-data) ──────────────────────────
  updateWithMedia: async (jobPostingId, formData) => {
    return multipartPut(`/jobpostings/${jobPostingId}`, formData);
  },

  update: async (jobPostingId, jobPostingData) => {
    const response = await api.put(`/jobpostings/${jobPostingId}`, jobPostingData);
    return response.data;
  },

  // ── DELETE job posting ────────────────────────────────────
  delete: async (jobPostingId) => {
    const response = await api.delete(`/jobpostings/${jobPostingId}`);
    return response.data;
  },

  // ── GET attachments for a job posting ─────────────────────
  getAttachments: async (jobPostingId) => {
    const token = await getToken();
    const res = await fetch(
      `${BASE_URL}/api/jobpostings/${jobPostingId}/attachments`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // ── DELETE a single attachment ────────────────────────────
  deleteAttachment: async (attachmentId) => {
    const response = await api.delete(`/jobpostings/attachments/${attachmentId}`);
    return response.data;
  },

  // ── Generic file upload (same /api/file/upload as achievements) ──
  uploadAttachments: async (jobPostingId, formData) =>
    multipartAttachmentUpload(jobPostingId, formData),

  // ── Build attachment URL from relative path ───────────────
  // Same helper as achievementService.getAttachmentUrl
  getAttachmentUrl: (attachmentId) => {
    return `${BASE_URL}/api/file/attachment/${attachmentId}`;
  },
};
