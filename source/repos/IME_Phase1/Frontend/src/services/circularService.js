import api from '../utils/api';

export const circularService = {
  getAll: async () => {
    const response = await api.get('/circular');
    return response.data;
  },

  getByClub: async () => {
    const response = await api.get('/circular/my-club');
    return response.data;
  },

  getById: async (circularId) => {
    const response = await api.get(`/circular/${circularId}`);
    return response.data;
  },

  create: async (data) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('publishDate', data.publishDate);
    if (data.description) form.append('description', data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);
    form.append('visibility', data.visibility || 'All');

    const response = await api.post('/circular', form);
    return response.data;
  },

  update: async (circularId, data) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('publishDate', data.publishDate);
    if (data.description) form.append('description', data.description);
    if (data.circularNumber) form.append('circularNumber', data.circularNumber);
    form.append('visibility', data.visibility || 'All');

    const response = await api.put(`/circular/${circularId}`, form);
    return response.data;
  },

  uploadAttachments: async (circularId, files) => {
    const form = new FormData();
    files.forEach((file) => {
      form.append('files', {
        uri: file.uri,
        name: file.fileName || file.uri.split(/[\\/]/).pop() || 'attachment',
        type: file.mimeType || 'application/octet-stream',
      });
    });

    try {
      const response = await api.post(`/circular/${circularId}/attachments`, form);
      if (response.data?.success === false) {
        throw new Error(response.data.message || 'Circular attachment upload failed.');
      }
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      const detail = responseData?.message
        || responseData?.Message
        || responseData?.title
        || responseData?.detail
        || error.message;
      const requestUrl = error.config?.url || `/circular/${circularId}/attachments`;
      throw new Error(
        `Attachment upload failed${status ? ` (${status})` : ''} at ${requestUrl}: ${detail}`
      );
    }
  },

  delete: async (circularId) => {
    const response = await api.delete(`/circular/${circularId}`);
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    debugger;
    const response = await api.delete(`/circular/attachment/${attachmentId}`);
    return response.data;
  },

  getAttachmentUrl: (attachmentId) => {
    return `${api.defaults.baseURL}/circular/attachment/${attachmentId}`;
  },
};
