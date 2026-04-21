import api from '../utils/api';

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
      return { success: false, message: error.message };
    }
  },

  getById: async (clubId) => {
    try {
      const response = await api.get(`/club/${clubId}`);
      return response.data;
    } catch (error) {
      console.error('Get club error:', error);
      return { success: false, message: error.message };
    }
  },

  create: async (data) => {
    try {
      const response = await api.post('/club', data);
      return response.data;
    } catch (error) {
      console.error('Create club error:', error);
      return { success: false, message: error.message };
    }
  },

  update: async (clubId, data) => {
    try {
      const response = await api.put(`/club/${clubId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update club error:', error);
      return { success: false, message: error.message };
    }
  },

  delete: async (clubId) => {
    try {
      const response = await api.delete(`/club/${clubId}`);
      return response.data;
    } catch (error) {
      console.error('Delete club error:', error);
      return { success: false, message: error.message };
    }
  },

  getCountries: async () => {
    try {
      const response = await api.get('/club/countries');
      return response.data;
    } catch (error) {
      console.error('Get countries error:', error);
      return { success: false, message: error.message };
    }
  },

  getStatesByCountry: async (countryId) => {
    try {
      const response = await api.get(`/club/states/${countryId}`);
      return response.data;
    } catch (error) {
      console.error('Get states error:', error);
      return { success: false, message: error.message };
    }
  },
};
