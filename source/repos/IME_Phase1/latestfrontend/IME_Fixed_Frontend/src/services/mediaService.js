import api from '../utils/api';

export const mediaService = {
  getAll: async (mediaType = null) => {
    const params = mediaType ? { mediaType } : {};
    const response = await api.get('/media', { params });
    return response.data;
  },

  getById: async (mediaId) => {
    const response = await api.get(`/media/${mediaId}`);
    return response.data;
  },

  create: async (mediaData) => {
    const response = await api.post('/media', mediaData);
    return response.data;
  },

  delete: async (mediaId) => {
    const response = await api.delete(`/media/${mediaId}`);
    return response.data;
  },
};
