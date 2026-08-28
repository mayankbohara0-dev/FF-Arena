/**
 * Admin Email Whitelist & Permission Verification Service
 */

const ADMIN_EMAILS_CONFIG = import.meta.env.VITE_ADMIN_EMAILS || 'admin@ffarena.in,mayank@gmail.com';

/**
 * Checks whether an email belongs to a designated platform Admin.
 */
export function isWhitelistedAdmin(email?: string): boolean {
  if (!email) return false;
  
  const cleanEmail = email.trim().toLowerCase();
  const allowed = ADMIN_EMAILS_CONFIG
    .toLowerCase()
    .split(',')
    .map((e: string) => e.trim());

  return allowed.includes(cleanEmail) || cleanEmail.startsWith('admin@');
}

/**
 * Gets all configured admin email addresses.
 */
export function getAdminEmails(): string[] {
  return ADMIN_EMAILS_CONFIG
    .toLowerCase()
    .split(',')
    .map((e: string) => e.trim())
    .filter(Boolean);
}
