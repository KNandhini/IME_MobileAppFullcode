import api from '../utils/api';

export const organisationService = {
  getAll: async () => {
    const response = await api.get('/organisation');
    return response.data;
  },

  getById: async (orgMemberId) => {
    const response = await api.get(`/organisation/${orgMemberId}`);
    return response.data;
  },

  create: async (memberData) => {
    const response = await api.post('/organisation', memberData);
    return response.data;
  },

  update: async (orgMemberId, memberData) => {
    const response = await api.put(`/organisation/${orgMemberId}`, memberData);
    return response.data;
  },

  delete: async (orgMemberId) => {
    const response = await api.delete(`/organisation/${orgMemberId}`);
    return response.data;
  },
};
