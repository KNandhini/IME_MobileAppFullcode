import api from '../utils/api';

export const circularService = {

  getAll: async () => {
    const response = await api.get('/circular');
    return response.data; // { success, data }
  },

  getById: async (circularId) => {
    const response = await api.get(`/circular/${circularId}`);
    return response.data;
  },

  create: async (circularData) => {
    debugger;
    const response = await api.post('/circular', circularData);
    return response.data;
  },

  update: async (circularId, circularData) => {
    const response = await api.put(`/circular/${circularId}`, circularData);
    return response.data;
  },

  delete: async (circularId) => {
    const response = await api.delete(`/circular/${circularId}`);
    return response.data;
  },
};