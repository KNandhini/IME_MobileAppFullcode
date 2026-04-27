import api from '../utils/api';

export const chatService = {
  getOrCreateConversation: async (otherMemberId) => {
    try {
      const response = await api.get(`/chat/conversation/${otherMemberId}`);
      return response.data;
    } catch (error) {
      console.error('getOrCreateConversation error:', error);
      return { success: false, message: error.message };
    }
  },

  getMessages: async (conversationId, pageNumber = 1, pageSize = 50) => {
    try {
      const response = await api.get(`/chat/conversation/${conversationId}/messages`, {
        params: { pageNumber, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('getMessages error:', error);
      return { success: false, message: error.message };
    }
  },

  sendMessage: async (conversationId, messageText, sentDate) => {
    try {
      const response = await api.post(`/chat/conversation/${conversationId}/messages`, {
        messageText,
        sentDate: sentDate ?? new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error('sendMessage error:', error);
      return { success: false, message: error.message };
    }
  },

  getConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('getConversations error:', error);
      return { success: false, message: error.message };
    }
  },
};
