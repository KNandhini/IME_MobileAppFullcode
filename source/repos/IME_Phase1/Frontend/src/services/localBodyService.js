import api from '../utils/api';

// Cache within the session so repeated tab visits don't re-fetch
const _cache = {};

export const localBodyService = {
  /**
   * Search master data by name + optional district.
   * Returns the LocalBodyDTO or null if not in the database.
   * This is called BEFORE AI/scraping on the CorpDetailsScreen.
   */
  searchLocalBody: async (name, district = null) => {
    const key = `${name}__${district || ''}`.toLowerCase();
    if (_cache[key] !== undefined) return _cache[key];

    try {
      const params = { name };
      if (district) params.district = district;

      const res = await api.get('/LocalBody/search', { params, timeout: 8000 });
      const data = res.data?.success ? (res.data?.data ?? null) : null;
      _cache[key] = data;
      return data;
    } catch (err) {
      console.warn('[LocalBody] search failed:', err.message);
      _cache[key] = null;
      return null;
    }
  },

  /**
   * Get all local bodies in a district, ordered by type then name.
   */
  getByDistrict: async (districtName) => {
    try {
      const res = await api.get(`/LocalBody/district/${encodeURIComponent(districtName)}`, { timeout: 8000 });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  },

  /**
   * Get all bodies of a given type state-wide.
   * type: 'Municipal Corporation' | 'Municipality' | 'Town Panchayat' | 'Village Panchayat'
   */
  getByType: async (localBodyType, stateName = 'Tamil Nadu') => {
    try {
      const res = await api.get(
        `/LocalBody/type/${encodeURIComponent(localBodyType)}`,
        { params: { state: stateName }, timeout: 8000 }
      );
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  },

  clearCache: () => { Object.keys(_cache).forEach(k => delete _cache[k]); },
};
