const SAFE_MESSAGES = {
  400: 'Invalid request',
  401: 'Please log in again',
  403: 'You do not have permission to perform this action',
  404: 'Not found',
  408: 'The request timed out. Please try again',
  409: 'This request could not be completed because of a conflict',
  413: 'The selected file is too large',
  422: 'Some details are invalid. Please check and try again',
  429: 'Too many requests. Please try again later',
  500: 'Something went wrong on our end. Please try again later',
  502: 'Something went wrong on our end. Please try again later',
  503: 'The service is temporarily unavailable. Please try again later',
  504: 'The service is temporarily unavailable. Please try again later',
};

let logEndpoint = null;

export const configureErrorHandler = ({ endpoint } = {}) => {
  logEndpoint = endpoint || null;
};

export const getSafeErrorMessage = (errorOrStatus) => {
  // If backend returned a custom message, use it first
  const backendMessage =
    errorOrStatus?.response?.data?.message ||
    errorOrStatus?.response?.data?.error ||
    errorOrStatus?.message ||
    errorOrStatus?.data?.message;

  if (backendMessage === 'Email already registered') {
    return 'This email is already registered. Please use a different email address or log in to your existing account.';
  }

  if (backendMessage) {
    return backendMessage;
  }

  const status =
    typeof errorOrStatus === 'number'
      ? errorOrStatus
      : errorOrStatus?.response?.status ||
      errorOrStatus?.status ||
      errorOrStatus?.statusCode;

  if (!status) {
    return 'Something went wrong. Please try again.';
  }

  return SAFE_MESSAGES[status] || 'Something went wrong. Please try again.';
};

const getRequestUrl = (error, context) => {
  const baseUrl = error?.config?.baseURL || '';
  const url = error?.config?.url || error?.url || context?.url || context?.endpoint || '';
  if (!baseUrl || /^https?:\/\//i.test(url)) return url;
  return `${baseUrl.replace(/\/$/, '')}/${String(url).replace(/^\//, '')}`;
};

const buildErrorDetails = (error, context = {}) => ({
  message: error?.message || String(error || 'Unknown error'),
  stack: error?.stack || null,
  status: error?.response?.status || error?.status || error?.statusCode || null,
  url: getRequestUrl(error, context),
  method: error?.config?.method?.toUpperCase?.() || context.method || null,
  endpoint: context.endpoint || error?.config?.url || null,
  source: context.source || null,
  timestamp: new Date().toISOString(),
});

const sendErrorToBackend = (details) => {
  if (!logEndpoint || typeof fetch !== 'function') return;

  fetch(logEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details),
  }).catch(() => { });
};

export const handleError = (error, context = {}) => {
  const details = buildErrorDetails(error, context);
  console.error('[IME Error]', details);
  sendErrorToBackend(details);
  return getSafeErrorMessage(details.status);
};

export const toSafeServiceError = (error, context = {}) => ({
  success: false,
  message: handleError(error, context),
  statusCode: error?.response?.status || error?.status || error?.statusCode || null,
});
