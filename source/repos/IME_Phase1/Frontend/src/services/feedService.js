import api from '../utils/api';

export const feedService = {
  getFeed: async (pageNumber = 1, pageSize = 10) => {
    const response = await api.get('/feed', {
      params: { pageNumber, pageSize },
    });
    return response.data; // { success, data: { items, pageNumber, pageSize, hasMore } }
  },

  createPost: async (content, mediaItems = []) => {
    const formData = new FormData();

    if (content) {
      formData.append('content', content);
    }

    mediaItems.forEach((item) => {
      formData.append('files', {
        uri:  item.uri,
        name: item.fileName || `media_${Date.now()}`,
        type: item.mimeType || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      });
    });

    const response = await api.post('/feed/post', formData);
    return response.data; // { success, message, data: { postId, mediaCount } }
  },
};
