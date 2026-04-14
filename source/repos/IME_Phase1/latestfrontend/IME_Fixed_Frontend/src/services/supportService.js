import api from '../utils/api';

export const supportService = {
  getCategories: async () => {
    const response = await api.get('/support/categories');
    return response.data;
  },

  getByCategory: async (categoryId) => {
    const response = await api.get(`/support/category/${categoryId}`);
    return response.data;
  },

  getById: async (supportId) => {
    const response = await api.get(`/support/${supportId}`);
    return response.data;
  },

  create: async (supportData) => {
    const response = await api.post('/support', supportData);
    return response.data;
  },

  update: async (supportId, supportData) => {
    const response = await api.put(`/support/${supportId}`, supportData);
    return response.data;
  },

  delete: async (supportId) => {
    const response = await api.delete(`/support/${supportId}`);
    return response.data;
  },
};
