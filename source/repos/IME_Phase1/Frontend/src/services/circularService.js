
import api, { BASE_URL } from '../utils/api';

import {
  uploadAttachments as uploadLocalAttachments,
} from '../utils/uploadAttachments';

// =====================================================
// API URL HELPER
// =====================================================

const getApiBaseUrl = () => {
  const base = String(
    BASE_URL || api.defaults.baseURL || ''
  ).replace(/\/+$/, '');

  if (!base) {
    throw new Error('API base URL is not configured.');
  }

  return /\/api$/i.test(base)
    ? base
    : `${base}/api`;
};

// =====================================================
// FORM DATA HELPER
// =====================================================

const buildCircularFormData = (data) => {
  const form = new FormData();

  form.append('title', data.title);
  form.append('publishDate', data.publishDate);

  if (data.description) {
    form.append('description', data.description);
  }

  if (data.circularNumber) {
    form.append('circularNumber', data.circularNumber);
  }

  form.append(
    'visibility',
    data.visibility || 'All'
  );

  return form;
};

// =====================================================
// CIRCULAR SERVICE
// =====================================================

export const circularService = {

  // ---------------------------------------------------
  // GET ALL CIRCULARS
  // ---------------------------------------------------

  getAll: async () => {
    const response = await api.get('/circular');
    return response.data;
  },

  // ---------------------------------------------------
  // GET CIRCULARS BY CLUB
  // ---------------------------------------------------

  getByClub: async () => {
    const response = await api.get(
      '/circular/my-club'
    );

    return response.data;
  },

  // ---------------------------------------------------
  // GET CIRCULAR BY ID
  // ---------------------------------------------------

  getById: async (circularId) => {
    if (!circularId) {
      throw new Error('Circular ID is required.');
    }

    const response = await api.get(
      `/circular/${circularId}`
    );

    return response.data;
  },

  // ---------------------------------------------------
  // CREATE CIRCULAR
  // ---------------------------------------------------

  create: async (data) => {
    const form = buildCircularFormData(data);

    const response = await api.post(
      '/circular',
      form,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    );

    return response.data;
  },

  // ---------------------------------------------------
  // UPDATE CIRCULAR
  // ---------------------------------------------------

  update: async (circularId, data) => {
    if (!circularId) {
      throw new Error('Circular ID is required.');
    }

    const form = buildCircularFormData(data);

    const response = await api.put(
      `/circular/${circularId}`,
      form,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    );

    return response.data;
  },

  // ===================================================
  // UPLOAD CIRCULAR ATTACHMENTS
  // SAME UPLOADER AS MAGAZINE
  // ===================================================

  uploadAttachments: async (circularId, files) => {
    if (!circularId) {
      throw new Error('Circular ID is missing.');
    }

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Please select at least one attachment.');
    }

    if (files.length > 5) {
      throw new Error('Maximum 5 attachments are allowed.');
    }

    const uploadUrl =
      `${getApiBaseUrl()}/circular/${encodeURIComponent(circularId)}/attachments`;

    console.log('Starting circular attachment upload:', {
      circularId,
      fileCount: files.length,
      uploadUrl,
    });

    files.forEach((file, index) => {
      console.log('Circular attachment:', {
        index,
        name: file.fileName || file.name,
        uri: file.uri,
        mimeType: file.mimeType,
      });
    });

    try {
      // Uses the same shared upload utility as Magazine.
      // No FileSystem.copyAsync().
      // No extra Expo File construction here.
      // No separate expoFetch multipart implementation.

      const result = await uploadLocalAttachments(
        uploadUrl,
        files
      );

      console.log(
        'Circular attachment upload completed:',
        result
      );

      return result;
    } catch (error) {
      console.error(
        'Circular attachment upload failed:',
        error
      );

      throw error;
    }
  },

  // ---------------------------------------------------
  // DELETE CIRCULAR
  // ---------------------------------------------------

  delete: async (circularId) => {
    if (!circularId) {
      throw new Error('Circular ID is required.');
    }

    const response = await api.delete(
      `/circular/${circularId}`
    );

    return response.data;
  },

  // ---------------------------------------------------
  // DELETE CIRCULAR ATTACHMENT
  // ---------------------------------------------------

  deleteAttachment: async (attachmentId) => {
    if (!attachmentId) {
      throw new Error('Attachment ID is required.');
    }

    const response = await api.delete(
      `/circular/attachment/${attachmentId}`
    );

    return response.data;
  },

  // ---------------------------------------------------
  // GET CIRCULAR ATTACHMENT URL
  // ---------------------------------------------------

  getAttachmentUrl: (attachmentId) => {
    if (!attachmentId) {
      return null;
    }

    return (
      `${getApiBaseUrl()}/circular/attachment/${encodeURIComponent(attachmentId)}`
    );
  },
};

export default circularService;
