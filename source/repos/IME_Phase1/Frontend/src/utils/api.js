import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { configureErrorHandler, handleError } from './errorHandler';
import { isTokenExpired } from './tokenUtils';
// navigateToLogin import removed — no longer needed
//const API_BASE_URL = 'http://10.0.2.2:51150/api';
//const API_BASE_URL = 'https://imei.co.in/api';
const API_BASE_URL = 'http://10.0.2.2:51150/api';
export const BASE_URL = API_BASE_URL.replace(/\/api$/, '');
configureErrorHandler({ endpoint: `${API_BASE_URL}/log-error` });

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Only clears storage here. AuthContext's poll (or its own login-state
// check) picks up the missing/expired token and calls forceLogout(),
// which flips isAuthenticated -> AppNavigator swaps to AuthStack -> Login.
export const clearSessionAndRedirect = async () => {
  await AsyncStorage.multiRemove(['authToken', 'userData', 'tokenExpiresAt']);
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    const expiresAt = await AsyncStorage.getItem('tokenExpiresAt');

    if (token && isTokenExpired(expiresAt)) {
      await clearSessionAndRedirect();
      return Promise.reject(new axios.Cancel('Session expired'));
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (config.data instanceof FormData) {
      // leave Content-Type unset for multipart
    } else {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    error.safeMessage = handleError(error, {
      endpoint: error.config?.url,
      method: error.config?.method?.toUpperCase?.(),
      source: 'api',
    });

    if (error.response?.status === 401) {
      await clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);

AppState.addEventListener('change', async (state) => {
  if (state === 'active') {
    const token = await AsyncStorage.getItem('authToken');
    const expiresAt = await AsyncStorage.getItem('tokenExpiresAt');
    if (token && isTokenExpired(expiresAt)) {
      await clearSessionAndRedirect();
    }
  }
});

export default api;