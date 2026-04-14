import api from '../utils/api';

export const memberService = {
  getProfile: async (memberId) => {
    try {
      const response = await api.get(`/member/profile/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: error.message };
    }
  },

  updateProfile: async (memberId, profileData) => {
    try {
      const response = await api.put(`/member/profile/${memberId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message };
    }
  },

  changePassword: async (memberId, passwordData) => {
    try {
      const response = await api.post(`/member/${memberId}/change-password`, passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: error.message };
    }
  },

  getPaymentHistory: async (memberId) => {
    try {
      const response = await api.get(`/member/payment-history/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment history error:', error);
      return { success: false, message: error.message };
    }
  },

  getAllMembers: async (pageNumber = 1, pageSize = 50) => {
    try {
      debugger;
      const response = await api.get('/member/all', {
        params: { pageNumber, pageSize },
      });
      return response.data;
    } catch (error) {
      console.error('Get all members error:', error);
      return { success: false, message: error.message };
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
    return { success: false, message: error.message };
  }
},

  rejectMember: async (memberId, reason) => {
  try {
    debugger;
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
    return { success: false, message: error.message };
  }
},

  deleteMember: async (memberId) => {
    try {
      const response = await api.delete(`/member/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('Delete member error:', error);
      return { success: false, message: error.message };
    }
  },

  searchMembers: async (searchTerm) => {
    try {
      
      const response = await api.get(`/member/search?term=${searchTerm}`);
      return response.data;
    } catch (error) {
      console.error('Search members error:', error);
      return { success: false, message: error.message };
    }
  },
};
