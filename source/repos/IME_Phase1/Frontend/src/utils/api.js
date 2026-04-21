import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Update with your actual backend URL ───────────────────────
// For local development use your machine IP (not localhost):
//   Android emulator: http://10.0.2.2:5000/api
//   Physical device:  http://YOUR_LOCAL_IP:5000/api
//   Production:       https://your-api-domain.com/api
//const API_BASE_URL = 'https://localhost:51149/api';
const API_BASE_URL = 'http://10.0.2.2:51150/api';
export const BASE_URL = API_BASE_URL.replace(/\/api$/, '');
 
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // Do NOT set Content-Type here — it breaks multipart/form-data uploads.
  // The interceptor below sets it per-request based on data type.
});

// Attach JWT token + set correct Content-Type per request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (config.data instanceof FormData) {
      // Do NOT set Content-Type for FormData.
      // React Native's native HTTP client will set multipart/form-data with the correct boundary.
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
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
