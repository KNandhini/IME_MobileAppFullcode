import api from '../utils/api';

export const activityService = {
  getAll: async (pageNumber = 1, pageSize = 20) => {
    const response = await api.get('/activity', {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },

  getById: async (activityId) => {
    const response = await api.get(`/activity/${activityId}`);
    return response.data;
  },

  create: async (activityData) => {
    const response = await api.post('/activity', activityData);
    return response.data;
  },

  update: async (activityId, activityData) => {
    const response = await api.put(`/activity/${activityId}`, activityData);
    return response.data;
  },

  delete: async (activityId) => {
    const response = await api.delete(`/activity/${activityId}`);
    return response.data;
  },
};
