import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';

// Reads the JWT from the parsed userData object in AsyncStorage — same
// pattern used by achievementService for multipart requests, since axios
// + FormData has boundary issues in React Native.
const getToken = async () => {
  const userData = await AsyncStorage.getItem('userData');
  if (!userData) return null;
  const parsed = JSON.parse(userData);
  return parsed?.token || parsed?.accessToken || null;
};

// expo/fetch rejects the old React Native file part { uri, name, type }
// ("Unsupported FormDataPart implementation"). The screens still build their
// FormData that way, so convert it here: every { uri } part becomes a real
// ExpoFile, text fields are copied across unchanged. No screen changes needed.
const toExpoFormData = (formData) => {
  const converted = new FormData();
  const parts = formData?._parts || [];

  parts.forEach(([key, value]) => {
    if (value && typeof value === 'object' && typeof value.uri === 'string') {
      converted.append(key, new ExpoFile(value.uri));
    } else {
      converted.append(key, value);
    }
  });

  return converted;
};

const multipartRequest = async (method, url, formData) => {
  const token = await getToken();
  const fullUrl = `${BASE_URL}/api${url}`;

  try {
    const res = await fetch(fullUrl, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: toExpoFormData(formData),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log(`[healthNutrition ${method}] FAILED:`, res.status, fullUrl, text);
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.log(`[healthNutrition ${method}] ERROR:`, fullUrl, error?.message);
    throw error;
  }
};

const multipartPost = (url, formData) => multipartRequest('POST', url, formData);

const multipartPut = (url, formData) => multipartRequest('PUT', url, formData);

// Health & Nutrition is a standalone, read-only-for-members module — it is
// intentionally NOT part of feedService / the Post feed. Posts only surface
// when a member opens the Health & Nutrition tile from the Admin Dashboard
// (or wherever HealthNutritionScreen is linked from) — never inside FundTab.
export const healthNutritionService = {
  getAll: async ({ search = '', sortDirection = 'DESC', pageNumber = 1, pageSize = 20 } = {}) => {
    const response = await api.get('/healthnutrition', {
      params: { search, sortDirection, pageNumber, pageSize },
    });
    return response.data; // { success, data: { items, pageNumber, totalPages, ... } }
  },

  getById: async (id) => {
    const response = await api.get(`/healthnutrition/${id}`);
    return response.data; // { success, data: { ...item } }
  },

  // ✅ Hits POST /api/healthnutrition (multipart) — field names must match
  // HealthNutritionCreateRequest exactly: Title, Description, PostedUser,
  // PostedBy, Attachment, Status.
  create: async (formData) => multipartPost('/healthnutrition', formData),

  // ✅ Hits PUT /api/healthnutrition/:id (multipart) — Attachment is
  // optional here; omit it to keep the existing file.
  update: async (id, formData) => multipartPut(`/healthnutrition/${id}`, formData),

  delete: async (id) => {
    const response = await api.delete(`/healthnutrition/${id}`);
    return response.data;
  },
};

export default healthNutritionService;