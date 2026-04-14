import api from '../utils/api';

export const fileService = {
  uploadFile: async (file, moduleName, recordId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('moduleName', moduleName);
    formData.append('recordId', recordId);

    const response = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultipleFiles: async (files, moduleName, recordId) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('moduleName', moduleName);
    formData.append('recordId', recordId);

    const response = await api.post('/file/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadProfilePhoto: async (file, memberId) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || 'profile.jpg',
    });
    formData.append('memberId', memberId.toString());

    const response = await api.post('/file/upload-profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadFile: async (filePath) => {
    const response = await api.get(`/file/download/${filePath}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteFile: async (attachmentId, tableName) => {
    const response = await api.delete(`/file/delete/${attachmentId}`, {
      params: { tableName },
    });
    return response.data;
  },

  getFileUrl: (filePath) => {
    // Construct full URL for displaying files
    const baseURL = api.defaults.baseURL.replace('/api', '');
    return `${baseURL}/file/download/${filePath}`;
  },
};
