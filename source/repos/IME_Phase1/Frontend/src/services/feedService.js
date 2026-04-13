import api from '../utils/api';

export const feedService = {
 
  getFeed: async (pageNumber = 1, pageSize = 10) => {
    
debugger;
    const response = await api.get('/feed', {
      params: { pageNumber, pageSize },
    });
    return response.data; // { success, data: { items, pageNumber, pageSize, hasMore } }
  },

  createPost: async (content, mediaItems = []) => {
    const formData = new FormData();
debugger;
    if (content) {
      formData.append('content', content);
    }

    mediaItems.forEach((item,index) => {
      formData.append('files', {
        uri:  item.uri,
        name: item.fileName || `media_${Date.now()}`,
        type: item.mimeType || (item.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      });
    });
    

    // 🔍 Log FormData
  for (let pair of formData._parts) {
    console.log('FormData:', pair[0], pair[1]);
  }

  try {
    console.log('➡️ API CALL: /feed/post');

    const response = await api.post('/feed/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // ✅ Success Response
    console.log('✅ API RESPONSE:', response);
    console.log('✅ RESPONSE DATA:', response.data);

    return response.data;

  } catch (error) {
    // ❌ Error Handling
    console.log('❌ API ERROR:', error);

    if (error.response) {
      console.log('❌ ERROR RESPONSE:', error.response.data);
      console.log('❌ STATUS:', error.response.status);
    } else if (error.request) {
      console.log('❌ NO RESPONSE RECEIVED:', error.request);
    } else {
      console.log('❌ ERROR MESSAGE:', error.message);
    }

    throw error;
  }
}
};
