import api, { BASE_URL } from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
//const BASE_URL = 'http://10.0.2.2:51150/api';
export const clubService = {
  getAll: async (pageNumber = 1, pageSize = 50, search = '', isActive = null) => {
    try {
      const params = { pageNumber, pageSize };
      if (search) params.search = search;
      if (isActive !== null) params.isActive = isActive;
      const response = await api.get('/club/all', { params });
      return response.data;
    } catch (error) {
      console.error('Get all clubs error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  getById: async (clubId) => {
    try {
      const response = await api.get(`/club/${clubId}`);
      return response.data;
    } catch (error) {
      console.error('Get club error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/club', data);
      return response.data;
    } catch (error) {
      console.error('Create club error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  update: async (clubId, data) => {
    try {
      const response = await api.put(`/club/${clubId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update club error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  uploadLogo: async (clubId, imageUri, fileName) => {
  try {
    debugger;
    const token = await AsyncStorage.getItem('authToken');
    const formData = new FormData();

    formData.append('file', {
      uri: imageUri,
      name: fileName || 'logo.jpg',
      type: 'image/jpeg',
    });
debugger;
    const response = await fetch(`${BASE_URL}/api/club/${clubId}/logo`, {
      method: 'POST',
      headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
      body: formData,
    });
    console.log("FINAL URL:", `${BASE_URL}/api/club/${clubId}/logo`);

    // ✅ Read as text first
    const text = await response.text();

    // ✅ Try parsing safely
    const data = text ? JSON.parse(text) : {};

    // 🔍 Debug
    console.log("Status:", response.status);
    console.log("Response:", data);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `HTTP ${response.status}`,
      };
    }

    return data;

  } catch (error) {
    console.error('Upload logo error:', error);
    return toSafeServiceError(error, { source: 'clubService' });
  }
},

  delete: async (clubId) => {
    try {
      const response = await api.delete(`/club/${clubId}`);
      return response.data;
    } catch (error) {
      console.error('Delete club error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  getNextCode: async () => {
    try {
      const response = await api.get('/club/next-code');
      return response.data;
    } catch (error) {
      console.error('Get next club code error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  getCountries: async () => {
    try {
      const response = await api.get('/club/countries');
      return response.data;
    } catch (error) {
      console.error('Get countries error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },

  getStatesByCountry: async (countryId) => {
    try {
      const response = await api.get(`/club/states/${countryId}`);
      return response.data;
    } catch (error) {
      console.error('Get states error:', error);
      return toSafeServiceError(error, { source: 'clubService' });
    }
  },
 updateClubByMemberId: async (memberIds, clubId) => {
  try {
    const response = await api.put(
      `/club/updateclubbymemberid?memberIds=${memberIds}&clubId=${clubId}`
    );
    return response.data;
  } catch (error) {
    console.error('Update club by member id error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
    };
  }
},
};

