// services/supportService.js
import api from '../utils/api';

export const supportService = {

  getCategories: async () => {
    const res = await api.get('/support/categories');
    return res.data;
  },

  getByCategory: async (categoryId) => {
    const res = await api.get(`/support/category/${categoryId}`);
    return res.data;
  },

  create: async (formData, attachments = []) => {
    const form = new FormData();
debugger;
    // Append all text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        form.append(key, String(value));
      }
    });

    // Append files
    attachments.forEach((file) => {
      form.append('files', {
        uri:  file.uri,
        name: file.fileName || `attachment_${Date.now()}`,
        type: file.mimeType || 'application/octet-stream',
      });
    });

   /* const res = await api.post('/support', form
      , {
      headers: { 'Content-Type': 'multipart/form-data' },
    }

  );*/
  const res = await api.post('/support', form);
    return res.data;
  },

  update: async (supportId, formData, attachments = []) => {
    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        form.append(key, String(value));
      }
    });

    attachments.forEach((file) => {
      form.append('files', {
        uri:  file.uri,
        name: file.fileName || `attachment_${Date.now()}`,
        type: file.mimeType || 'application/octet-stream',
      });
    });

    /*const res = await api.put(`/support/${supportId}`, form
      , {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
      
     );*/
      const res = await api.put(`/support/${supportId}`, form);
    return res.data;
  },

  delete: async (supportId) => {
    const res = await api.delete(`/support/${supportId}`);
    return res.data;
  },

  deleteAttachment: async (attachmentId) => {
    const res = await api.delete(`/support/attachment/${attachmentId}`);
    return res.data;
  },

  // Returns the URL to display/download an attachment
  getAttachmentUrl: (attachmentId) => {
    return `${api.defaults.baseURL}/support/attachment/${attachmentId}`;
  },
};