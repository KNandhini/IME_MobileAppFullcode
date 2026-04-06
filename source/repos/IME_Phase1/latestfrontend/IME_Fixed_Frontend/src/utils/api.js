import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Update with your actual backend URL ───────────────────────
// For local development use your machine IP (not localhost):
//   Android emulator: http://10.0.2.2:5000/api
//   Physical device:  http://YOUR_LOCAL_IP:5000/api
//   Production:       https://your-api-domain.com/api
const API_BASE_URL = 'http://YOUR_SERVER_IP:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

export default api;
