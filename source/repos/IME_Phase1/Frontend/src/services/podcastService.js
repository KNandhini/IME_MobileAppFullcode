import api from '../utils/api';

export const podcastService = {
  getAll: async () => {
    const response = await api.get('/podcasts');
    return response.data;
  },

  getById: async (podcastId) => {
    const response = await api.get(`/podcasts/${podcastId}`);
    return response.data;
  },

  create: async (podcastData) => {
    const response = await api.post('/podcasts', podcastData);
    return response.data;
  },

  update: async (podcastId, podcastData) => {
    const response = await api.put(`/podcasts/${podcastId}`, podcastData);
    return response.data;
  },

  delete: async (podcastId) => {
    const response = await api.delete(`/podcasts/${podcastId}`);
    return response.data;
  },
};
