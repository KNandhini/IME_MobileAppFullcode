import api from '../utils/api';

export const municipalCorpService = {
  getDistricts: async (stateId) => {
    try {
      const response = await api.get(`/MunicipalCorp/districts/${stateId}`);
      return response.data;
    } catch (error) {
      console.error('Get districts error:', error);
      return { success: false, message: error.message };
    }
  },

  getCorpsByDistrict: async (districtId) => {
    try {
      const response = await api.get(`/MunicipalCorp/corps/district/${districtId}`);
      return response.data;
    } catch (error) {
      console.error('Get corps by district error:', error);
      return { success: false, message: error.message };
    }
  },

  getCorpsByState: async (stateId) => {
    try {
      const response = await api.get(`/MunicipalCorp/corps/state/${stateId}`);
      return response.data;
    } catch (error) {
      console.error('Get corps by state error:', error);
      return { success: false, message: error.message };
    }
  },

  getCorpById: async (corpId) => {
    try {
      const response = await api.get(`/MunicipalCorp/corps/${corpId}`);
      return response.data;
    } catch (error) {
      console.error('Get corp by id error:', error);
      return { success: false, message: error.message };
    }
  },
};
