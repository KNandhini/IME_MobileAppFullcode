import api from '../utils/api';

export const fundraiseService = {

  getAll: async () => {
    const response = await api.get('/Fundraise');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/Fundraise/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/Fundraise', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/Fundraise/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/Fundraise/${id}`);
    return response.data;
  },

  /**
   * POST /api/Fundraise/{id}/attachments
   *
   * Accepts a pre-built FormData object from the screen.
   * The screen appends each file as:
   *   formData.append("files", { uri, name, type })
   *
   * ✅ Content-Type is set here so axios doesn't override it with application/json
   */
uploadAttachments: async (id, formData) => {
  console.log("📡 API CALL STARTED → /Fundraise/" + id + "/attachments");

  try {
    // Use fetch instead of axios — axios corrupts multipart boundaries in React Native
    const token = await AsyncStorage.getItem('authToken');

    const response = await fetch(
      `http://10.0.2.2:51150/api/Fundraise/${id}/attachments`,
      {
        method: 'POST',
        headers: {
          // DO NOT set Content-Type — fetch sets it automatically with the correct boundary
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Server error:", errorText);
      throw new Error(`Server responded ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ API SUCCESS:", data);
    return data;

  } catch (error) {
    console.log("❌ API FAILED:", error.message);
    throw error;
  }
},
  getFile: async (params = {}) => {
    const response = await api.get('/Fundraise/file', { params });
    return response.data;
  },

  deleteFile: async (params = {}) => {
    const response = await api.delete('/Fundraise/file', { params });
    return response.data;
  },
};