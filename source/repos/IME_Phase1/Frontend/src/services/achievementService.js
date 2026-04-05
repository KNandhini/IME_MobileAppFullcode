import api from '../utils/api';

export const achievementService = {
  getAll: async () => {
    const response = await api.get('/achievements');
    return response.data;
  },

  getById: async (achievementId) => {
    const response = await api.get(`/achievements/${achievementId}`);
    return response.data;
  },

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
