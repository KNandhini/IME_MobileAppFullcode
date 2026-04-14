import api from '../utils/api';

export const fundraiseService = {
  // ─── CRUD ─────────────────────────────────────────────────────────────────

  // GET /api/Fundraise
  getAll: async () => {
    const response = await api.get('/Fundraise');
    return response.data;
  },

  // GET /api/Fundraise/{id}
  getById: async (id) => {
    const response = await api.get(`/Fundraise/${id}`);
    return response.data;
  },

  // POST /api/Fundraise
  create: async (data) => {
    const response = await api.post('/Fundraise', data);
    return response.data;
  },

  // PUT /api/Fundraise/{id}
  update: async (id, data) => {
    const response = await api.put(`/Fundraise/${id}`, data);
    return response.data;
  },

  // DELETE /api/Fundraise/{id}
  delete: async (id) => {
    const response = await api.delete(`/Fundraise/${id}`);
    return response.data;
  },

  // ─── ATTACHMENTS ──────────────────────────────────────────────────────────

  /**
   * POST /api/Fundraise/{id}/attachments
   * Uploads one or more files for a given fund.
   *
   * @param {string|number} id          - Fund ID
   * @param {Array<{uri, name, mimeType}>} files - Array of file objects from
   *                                       DocumentPicker / ImagePicker
   * @returns {Promise<any>}             - API response (uploaded file metadata)
   *
   * Usage:
   *   await fundraiseService.uploadAttachments(fundId, [
   *     { uri: 'file:///...', name: 'doc.pdf',  mimeType: 'application/pdf' },
   *     { uri: 'file:///...', name: 'photo.jpg', mimeType: 'image/jpeg'     },
   *   ]);
   */
  uploadAttachments: async (id, files) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name || 'attachment',
        type: file.mimeType || 'application/octet-stream',
      });
    });

    const response = await api.post(`/Fundraise/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  /**
   * GET /api/Fundraise/file
   * Retrieves a file (or file listing) from the server.
   *
   * @param {Object} params - Query params, e.g. { fileName: 'doc.pdf' }
   *                          or { fundraiseId: 5 } — adjust to match your API
   * @returns {Promise<any>}
   *
   * Usage:
   *   const file = await fundraiseService.getFile({ fileName: 'doc.pdf' });
   */
  getFile: async (params = {}) => {
    const response = await api.get('/Fundraise/file', { params });
    return response.data;
  },

  /**
   * DELETE /api/Fundraise/file
   * Deletes a specific attachment from the server.
   *
   * @param {Object} params - Query params, e.g. { fileName: 'doc.pdf' }
   *                          or { fileId: 12 } — adjust to match your API
   * @returns {Promise<any>}
   *
   * Usage:
   *   await fundraiseService.deleteFile({ fileName: 'doc.pdf' });
   */
  deleteFile: async (params = {}) => {
    const response = await api.delete('/Fundraise/file', { params });
    return response.data;
  },
};