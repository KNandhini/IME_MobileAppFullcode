import api, { BASE_URL } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reads the JWT from the parsed userData object in AsyncStorage — same
// pattern used by achievementService for multipart requests, since axios
// + FormData has boundary issues in React Native.
const getToken = async () => {
  const userData = await AsyncStorage.getItem('userData');
  if (!userData) return null;
  const parsed = JSON.parse(userData);
  return parsed?.token || parsed?.accessToken || null;
};

const multipartPost = async (url, formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${url}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

const multipartPut = async (url, formData) => {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api${url}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
};

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