import api from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';

export const chatService = {
  getOrCreateConversation: async (otherMemberId) => {
    try {
      const response = await api.get(`/chat/conversation/${otherMemberId}`);
      return response.data;
    } catch (error) {
      console.error('getOrCreateConversation error:', error);
      return toSafeServiceError(error, { source: 'chatService' });
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
      return toSafeServiceError(error, { source: 'chatService' });
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
      return toSafeServiceError(error, { source: 'chatService' });
    }
  },

  getConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('getConversations error:', error);
      return toSafeServiceError(error, { source: 'chatService' });
    }
  },
};

