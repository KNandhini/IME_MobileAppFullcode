import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const feedService = {
  getFeed: async (pageNumber = 1, pageSize = 10) => {
    debugger;
    const response = await api.get('/feed', {
      params: { pageNumber, pageSize },
    });
    return response.data; // { success, data: { items, pageNumber, pageSize, hasMore } }
  },

  /*getMemberFeed: async (memberId, pageNumber = 1, pageSize = 10) => {
    try {
      const response = await api.get(`/feed/member/${memberId}`, {
        params: { pageNumber, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('getMemberFeed error:', error);
      return { success: false, message: error.message };
    }
  },*/
  getMemberFeed: async (memberId, pageNumber = 1, pageSize = 10) => {
  try {
    debugger;
    // ── Get viewer's own memberId from AsyncStorage userData ──
    let viewerId;
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        viewerId = userData?.memberId;
      }
    } catch (e) {
      console.warn('Could not read userData for viewerId:', e);
    }

    const response = await api.get(`/feed/member/${memberId}`, {
      params: {
        pageNumber,
        pageSize,
        ...(viewerId ? { viewerId } : {}),
      },
    });
    return response.data;
  } catch (error) {
    console.error('getMemberFeed error:', error);
    return { success: false, message: error.message };
  }
},

  // Use native fetch instead of axios — axios + FormData has reliability issues in React Native.
  createPost: async (content, mediaItems = [], clubId = 0) => {
    const token = await AsyncStorage.getItem('authToken');

    const formData = new FormData();
    if (content) {
      formData.append('content', content);
    }
    formData.append('clubId', String(clubId));
    formData.append('createdDate', new Date().toISOString());
    mediaItems.forEach((item) => {
      formData.append('files', {
        uri:  item.uri,
        name: item.fileName || `media_${Date.now()}`,
        type: item.mimeType || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      });
    });

    const response = await fetch(`${BASE_URL}/api/feed/post`, {
      method: 'POST',
      headers: {
        // Do NOT set Content-Type — fetch sets multipart/form-data with boundary automatically
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
      throw Object.assign(new Error(parsed?.message || `HTTP ${response.status}`), {
        response: { status: response.status, data: parsed },
      });
    }

    return response.json(); // { success, message, data: { postId, mediaCount } }
  },
  deletePost: async (postId) => {
    debugger;
  const response = await api.delete(`/Feed/post/${postId}`);
  return response.data;
},
};
