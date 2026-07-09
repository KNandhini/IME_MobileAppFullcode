import api from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';

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
      return toSafeServiceError(error, { source: 'registrationService' });
    }
  },

  // Cancel registration
  cancel: async (registrationId) => {
    try {
      const response = await api.delete(`/activity/register/${registrationId}`);
      return response.data;
    } catch (error) {
      console.error('Cancel registration error:', error);
      return toSafeServiceError(error, { source: 'registrationService' });
    }
  },

  // Get member's registered activities
  getMyRegistrations: async (memberId) => {
    try {
      const response = await api.get(`/activity/my-registrations/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Get registrations error:', error);
      return toSafeServiceError(error, { source: 'registrationService' });
    }
  },

  // Check if member is registered for activity
  checkRegistration: async (activityId, memberId) => {
    try {
      const response = await api.get(`/activity/check-registration/${activityId}/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Check registration error:', error);
      return toSafeServiceError(error, { source: 'registrationService' });
    }
  },

  // Get activity participants (for organizers/admin)
  getParticipants: async (activityId) => {
    try {
      const response = await api.get(`/activity/${activityId}/participants`);
      return response.data;
    } catch (error) {
      console.error('Get participants error:', error);
      return toSafeServiceError(error, { source: 'registrationService' });
    }
  },
};

