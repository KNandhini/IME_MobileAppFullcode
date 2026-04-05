import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/Auth/login', { email, password });

    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem('authToken', response.data.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.data));
    }

    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/Auth/signup', userData);
    return response.data;
  },

  forgotPassword: async (email, dateOfBirth) => {
    const response = await api.post('/Auth/forgot-password', {
      email,
      dateOfBirth,
    });
    return response.data;
  },

  resetPassword: async (userId, newPassword) => {
    const response = await api.post('/Auth/reset-password', {
      userId,
      newPassword,
    });
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },

  getCurrentUser: async () => {
    const userDataString = await AsyncStorage.getItem('userData');
    return userDataString ? JSON.parse(userDataString) : null;
  },
};
