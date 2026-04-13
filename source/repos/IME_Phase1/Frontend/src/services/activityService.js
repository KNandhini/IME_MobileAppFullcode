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

  // ── Attachments ──────────────────────────────────────────
  getAttachments: async (activityId) => {
    const response = await api.get(`/activity/${activityId}/attachments`);
    return response.data;
  },

  uploadAttachments: async (activityId, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', {
        uri:  file.uri,
        name: file.fileName || file.uri.split('/').pop(),
        type: file.mimeType || 'application/octet-stream',
      });
    });
    const response = await api.post(`/activity/${activityId}/attachments`, formData);
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    const response = await api.delete(`/activity/attachments/${attachmentId}`);
    return response.data;
  },

  getAttachmentFileUrl: (attachmentId) => {
    const base = api.defaults.baseURL;
    return `${base}/activity/attachments/${attachmentId}/file`;
  },
};
