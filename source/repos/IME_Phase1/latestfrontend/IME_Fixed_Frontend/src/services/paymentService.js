import api from '../utils/api';

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

  getCurrentFee: async () => {
    const response = await api.get('/payment/current-fee');
    return response.data;
  },

  setFee: async (amount, effectiveFrom) => {
    const response = await api.post('/payment/set-fee', {
      amount,
      effectiveFrom,
    });
    return response.data;
  },
};
