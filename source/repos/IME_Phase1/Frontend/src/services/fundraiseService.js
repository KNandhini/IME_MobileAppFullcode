import api from '../utils/api';

export const fundraiseService = {
  // ✅ GET ALL
  getAll: async () => {
    const response = await api.get('/Fundraise');
    return response.data;
  },

  // ✅ GET BY ID
  getById: async (id) => {
    const response = await api.get(`/Fundraise/${id}`);
    return response.data;
  },

  // ✅ CREATE
  create: async (data) => {
    const response = await api.post('/Fundraise', data);
    return response.data;
  },

  // ✅ UPDATE
  update: async (id, data) => {
    const response = await api.put(`/Fundraise/${id}`, data);
    return response.data;
  },

  // ✅ DELETE
  delete: async (id) => {
    const response = await api.delete(`/Fundraise/${id}`);
    return response.data;
  },
};