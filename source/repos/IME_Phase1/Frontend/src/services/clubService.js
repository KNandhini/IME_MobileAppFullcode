import api, { BASE_URL } from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';
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

  // Same approach as feedService.createPost: expo/fetch + ExpoFile.
  // Expo's fetch no longer accepts the old { uri, name, type } FormData
  // object ("Unsupported FormDataPart implementation"), so the file is
  // appended as an expo-file-system File (read from its uri).
  uploadLogo: async (clubId, imageUri, fileName) => {
    const url = `${BASE_URL}/api/club/${clubId}/logo`;

    try {
      const token = await AsyncStorage.getItem('authToken');

      const formData = new FormData();
      formData.append('file', new ExpoFile(imageUri));

      console.log('[uploadLogo] URL:', url, 'uri:', imageUri, 'hasToken:', !!token);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      console.log('[uploadLogo] status:', response.status);

      // Read as text first, then parse safely
      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

      console.log('[uploadLogo] response:', data);

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