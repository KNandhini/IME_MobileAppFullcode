import api from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';

export const memberService = {
  getProfile: async (memberId) => {
    try {
      debugger;
      const response = await api.get(`/member/profile/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },
  getMembersByClub: async (clubId, pageNumber = 1, pageSize = 200) => {
    debugger;
    const response = await api.get(
        `/member/by-club?clubId=${clubId}&pageNumber=${pageNumber}&pageSize=${pageSize}`
    );
    return response.data;
},

  updateProfile: async (memberId, profileData) => {
    try {
      debugger;
      const response = await api.put(`/member/profile/${memberId}`, profileData);
      return response.data;
    } catch (error) {
      debugger;
      console.error('Update profile error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },

  changePassword: async (memberId, passwordData) => {
    try {
      const response = await api.post(`/member/${memberId}/change-password`, passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },

  getPaymentHistory: async (memberId) => {
    try {
      const response = await api.get(`/member/payment-history/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment history error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },

  getAllMembers: async (pageNumber = 1, pageSize = 200) => {
    try {
      debugger;
      const response = await api.get('/member/all', {
        params: { pageNumber, pageSize },
         timeout: 120000, // ← override per request
      });
      return response.data;
    } catch (error) {
      debugger;
      console.error('Get all members error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },
getMemberPhotosByIds: async (memberIds = []) => {
  try {
    if (!memberIds.length) return { success: true, data: [] };
    const response = await api.get('/member/photos-by-ids', {
      params: { memberIds: memberIds.join(',') }, // "1,2,3,5"
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    console.error('Get member photos by ids error:', error);
    return toSafeServiceError(error, { source: 'memberService' });
  }
},
  approveMember: async (memberId) => {
  try {
    const response = await api.put(
      `/member/${memberId}/status`,
      "Active", // ✅ send status as string
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Approve member error:', error);
    return toSafeServiceError(error, { source: 'memberService' });
  }
},

  rejectMember: async (memberId, reason) => {
  try {
    const response = await api.put(
      `/member/${memberId}/status`,
      {
        Status: "Rejected",  // ✅ matches request.Status in C#
        Reason: reason,      // ✅ matches request.Reason in C#
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Reject member error:', error);
    return toSafeServiceError(error, { source: 'memberService' });
  }
},

  deleteMember: async (memberId) => {
    try {
      debugger;
      const response = await api.delete(`/member/${memberId}`);
      return response.data;
    } catch (error) {
      debugger;
      console.error('Delete member error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },

  searchMembers: async (searchTerm) => {
    try {
      
      const response = await api.get(`/member/search?term=${searchTerm}`);
      return response.data;
    } catch (error) {
      console.error('Search members error:', error);
      return toSafeServiceError(error, { source: 'memberService' });
    }
  },
};

