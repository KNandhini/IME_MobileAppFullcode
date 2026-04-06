import api from '../utils/api';

export const registrationService = {
  // Register for an activity
  register: async (activityId, memberId) => {
    try {
      const response = await api.post('/activity/register', {
        activityId,
        memberId,
      });
      return response.data;
    } catch (error) {
      console.error('Register activity error:', error);
      return { success: false, message: error.message };
    }
  },

  // Cancel registration
  cancel: async (registrationId) => {
    try {
      const response = await api.delete(`/activity/register/${registrationId}`);
      return response.data;
    } catch (error) {
      console.error('Cancel registration error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get member's registered activities
  getMyRegistrations: async (memberId) => {
    try {
      const response = await api.get(`/activity/my-registrations/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Get registrations error:', error);
      return { success: false, message: error.message };
    }
  },

  // Check if member is registered for activity
  checkRegistration: async (activityId, memberId) => {
    try {
      const response = await api.get(`/activity/check-registration/${activityId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Check registration error:', error);
      return { success: false, message: error.message };
    }
  },

  // Get activity participants (for organizers/admin)
  getParticipants: async (activityId) => {
    try {
      const response = await api.get(`/activity/${activityId}/participants`);
      return response.data;
    } catch (error) {
      console.error('Get participants error:', error);
      return { success: false, message: error.message };
    }
  },
};
