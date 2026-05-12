// ══════════════════════════════════════════════════════════════════
//  lawBotService.js
//  Place in:  src/services/lawBotService.js
// ══════════════════════════════════════════════════════════════════

import api from '../utils/api';

export const lawBotService = {
  ask: async (question) => {
    try {
      const response = await api.post('/lawbot/ask', { question });
      return response.data;
    } catch (error) {
      console.error('LawBot service error:', error);
      return { success: false, message: error.message };
    }
  },
};