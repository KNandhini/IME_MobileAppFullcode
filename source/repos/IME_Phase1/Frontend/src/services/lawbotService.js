// ══════════════════════════════════════════════════════════════════
//  lawBotService.js
//  Place in:  src/services/lawBotService.js
// ══════════════════════════════════════════════════════════════════

import api from '../utils/api';
import { toSafeServiceError } from '../utils/errorHandler';

export const lawBotService = {
  ask: async (question) => {
    try {
      const response = await api.post('/lawbot/ask', { question });
      return response.data;
    } catch (error) {
      console.error('LawBot service error:', error);
      return toSafeServiceError(error, { source: 'lawbotService' });
    }
  },
};
