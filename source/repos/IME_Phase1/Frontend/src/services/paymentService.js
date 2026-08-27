import api from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';
export const paymentService = {
  createOrder: async (memberId) => {
    const response = await api.post('/payment/create-order', { memberId });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/payment/verify-payment', paymentData);
    return response.data;
  },

  generateQR: async (memberId) => {
    const response = await api.post('/payment/generate-qr', { memberId });
    return response.data;
  },

  confirmQRPayment: async (paymentData) => {
    const response = await api.post('/payment/confirm-qr-payment', paymentData);
    return response.data;
  },

  getPaymentHistory: async (memberId) => {
    const response = await api.get(`/payment/history/${memberId}`);
    return response.data;
  },

  getAllPayments: async (pageNumber = 1, pageSize = 50) => {
    const response = await api.get('/payment/all', {
      params: { pageNumber, pageSize },
    });
    return response.data;
  },
getCurrentFees: async () => {
    const response = await api.get('/payment/current-fees');
    return response.data;
},

 getCurrentFee: async (roleId) => {
  const response = await api.get(`/payment/current-fee/${roleId}`);
  return response.data;
},

  setFee: async (amount, effectiveFrom) => {
    const response = await api.post('/payment/set-fee', {
      amount,
      effectiveFrom,
    });
    return response.data;
  },
  getPaymentReport: async (clubId, startMonth, startYear, endMonth, endYear) => {
    try {
      const response = await api.get('/payment/report', {
        params: {
          clubId,
          startMonth,
          startYear,
          endMonth,
          endYear,
        },
      });
      return response.data;
    } catch (error) {
      console.error('getPaymentReport error:', error);
      return toSafeServiceError(error, { source: 'paymentService' });
    }
  },
   getMemberHistory: async (memberId) => {
    try {
      const res = await api.get(`/Payment/member-history/${memberId}`);
      return res.data;
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },
  getExcelDownloadUrl: (memberId) => {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    return `${base}/Payment/member-history/${memberId}/excel`;
  },
};
