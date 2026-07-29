export const isTokenExpired = (expiresAt) => {
  if (!expiresAt) return true;

  // .NET DateTimeOffset can serialize with extra precision that some JS
  // engines (notably Hermes, used by React Native) fail to parse, silently
  // returning NaN. NaN <= Date.now() evaluates to false, which means an
  // unparseable date would never be treated as expired. Sanitize to
  // millisecond precision (3 fractional digits) before parsing, and treat
  // any still-unparseable value as expired rather than trusting it blindly.
  const sanitized = expiresAt.replace(/(\.\d{3})\d*/, '$1');
  const expiryTime = new Date(sanitized).getTime();

  if (Number.isNaN(expiryTime)) return true;

  return expiryTime <= Date.now();
};