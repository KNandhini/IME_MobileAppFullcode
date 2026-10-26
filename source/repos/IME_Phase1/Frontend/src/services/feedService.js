import api, { BASE_URL } from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';

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
      return toSafeServiceError(error, { source: 'feedService' });
    }
  },*/
  getMemberFeed: async (memberId, pageNumber = 1, pageSize = 10) => {
  try {
    debugger;
    // ── Get auth token from AsyncStorage ──
    let token;
    try {
      token = await AsyncStorage.getItem('token'); // adjust key if you store it differently
    } catch (e) {
      console.warn('Could not read auth token:', e);
    }

    const response = await api.get(`/Feed/member/${memberId}`, {
      params: {
        pageNumber,
        pageSize,
      },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    debugger;
    return response.data;
  } catch (error) {
    debugger;
    console.error('getMemberFeed error:', error);
    return toSafeServiceError(error, { source: 'feedService' });
  }
},

  // Uses expo/fetch + ExpoFile: the Expo fetch no longer accepts the old
  // { uri, name, type } FormData object, and the global File needs
  // (parts, name), so we use expo-file-system's File (reads from a uri).
createPost: async (content, mediaItems = [], clubId = 0) => {
  const url = `${BASE_URL}/api/Feed/post`;

  try {
    const token = await AsyncStorage.getItem('authToken');

    const formData = new FormData();
    if (content) {
      formData.append('content', content);
    }
    formData.append('clubId', String(clubId));
    formData.append('createdDate', new Date().toISOString());

    mediaItems.forEach((item) => {
      console.log('[createPost] file uri:', item.uri);
      formData.append('files', new ExpoFile(item.uri));
    });

    console.log('[createPost] URL:', url, 'files:', mediaItems.length, 'hasToken:', !!token);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    console.log('[createPost] status:', response.status);

    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { message: text }; }

    // HTTP error (400, 401, 413, 500 ...)
    if (!response.ok) {
      console.log('[createPost] FAILED:', response.status, text);
      throw Object.assign(new Error(body?.message || `HTTP ${response.status}`), {
        response: { status: response.status, data: body },
      });
    }

    // The API returns 200 with success:false for business errors
    if (body?.success === false) {
      console.log('[createPost] API said no:', body.message);
      throw Object.assign(new Error(body.message || 'Post failed.'), {
        response: { status: response.status, data: body },
      });
    }

    // Files sent but none saved (usually a missing/unsupported extension)
    const sent = mediaItems.length;
    const saved = body?.data?.mediaCount ?? 0;
    if (sent > 0 && saved < sent) {
      console.log(`[createPost] WARNING: sent ${sent} file(s), server saved ${saved}`);
    }

    return body; // { success, message, data: { postId, mediaCount } }
  } catch (error) {
    console.log('[createPost] ERROR:', {
      url,
      status: error?.response?.status,
      message: error?.message,
    });
    throw error;
  }
},
  deletePost: async (postId) => {
    debugger;
  const response = await api.delete(`/Feed/post/${postId}`);
  return response.data;
},
};