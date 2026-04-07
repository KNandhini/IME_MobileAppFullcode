import api from '../utils/api';

export const contentService = {
  getByKey: async (pageKey) => {
    const response = await api.get(`/content/${pageKey}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/content');
    return response.data;
  },

  update: async (pageKey, contentData) => {
    const response = await api.put(`/content/${pageKey}`, contentData);
    return response.data;
  },
};
