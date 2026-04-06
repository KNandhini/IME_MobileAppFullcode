import api from '../utils/api';

export const newsService = {
  getAll: async (pageNumber = 1, pageSize = 20) => {
    const response = await api.get('/news', {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  getById: async (newsId) => {
    const response = await api.get(`/news/${newsId}`);
    return response.data;
  },

  create: async (newsData) => {
    const response = await api.post('/news', newsData);
    return response.data;
  },

  update: async (newsId, newsData) => {
    const response = await api.put(`/news/${newsId}`, newsData);
    return response.data;
  },

  delete: async (newsId) => {
    const response = await api.delete(`/news/${newsId}`);
    return response.data;
  },
};
