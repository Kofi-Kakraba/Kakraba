// Server-side check that a request carries the admin login set in your hosting
// environment (ADMIN_USER and ADMIN_PASSWORD). Used by the Campaigns save action.
// If either variable is missing, nobody is let in.

export function isValidAdminAuthHeader(header) {
  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASSWORD;
  if (!validUser || !validPass) return false;
  if (!header || !header.startsWith('Basic ')) return false;
  try {
    const decoded = atob(header.slice(6).trim());
    const i = decoded.indexOf(':');
    if (i < 0) return false;
    return decoded.slice(0, i) === validUser && decoded.slice(i + 1) === validPass;
  } catch {
    return false;
  }
}
