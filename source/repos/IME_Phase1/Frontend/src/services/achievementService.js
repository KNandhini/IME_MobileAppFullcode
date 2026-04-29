import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const multipartPost = async (url, formData) => {
  const token = await AsyncStorage.getItem('authToken');
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

const multipartPut = async (url, formData) => {
  const token = await AsyncStorage.getItem('authToken');
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

export const achievementService = {
  getAll: async () => {
    const response = await api.get('/achievements');
    return response.data;
  },

  getById: async (achievementId) => {
    const response = await api.get(`/achievements/${achievementId}`);
    return response.data;
  },

  createWithMedia: async (formData) => multipartPost('/achievements', formData),

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
};
