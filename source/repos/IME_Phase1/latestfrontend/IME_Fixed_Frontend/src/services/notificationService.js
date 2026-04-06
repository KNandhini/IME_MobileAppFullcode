import api from '../utils/api';

export const notificationService = {
  getUserNotifications: async (userId) => {
    const response = await api.get(`/notification/user/${userId}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notification/${notificationId}/read`);
    return response.data;
  },

  getUnreadCount: async (userId) => {
    const response = await api.get(`/notification/unread-count/${userId}`);
    return response.data;
  },

  createNotification: async (notificationData) => {
    const response = await api.post('/notification', notificationData);
    return response.data;
  },

  sendToAll: async (notificationData) => {
    const response = await api.post('/notification/send-to-all', notificationData);
    return response.data;
  },
};
