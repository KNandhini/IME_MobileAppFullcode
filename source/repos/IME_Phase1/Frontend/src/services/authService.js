import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/Auth/login', { email, password });
      const res = response.data;

      // Support both { success, data: { token } } and { token } response shapes
      const data = res.data || res;
      const token = data?.token;

      if (token) {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(data));
      }

      return { success: !!(res.success !== false && token), data, message: res.message };
    } catch (error) {
      throw error;
    }
  },

  signup: async (userData) => {
    const response = await api.post('/Auth/signup', userData);
    return response.data;
  },

  forgotPassword: async (email, dateOfBirth) => {
    const response = await api.post('/Auth/forgot-password', { email, dateOfBirth });
    return response.data;
  },

  resetPassword: async (userId, newPassword) => {
    const response = await api.post('/Auth/reset-password', { userId, newPassword });
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },

  getCurrentUser: async () => {
    const str = await AsyncStorage.getItem('userData');
    return str ? JSON.parse(str) : null;
  },
};
