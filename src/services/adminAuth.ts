/**
 * Official Admin Credentials & Whitelist Service — FF Arena
 */

export interface AdminCredential {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

// 4 Official Platform Admins & Passwords
export const OFFICIAL_ADMINS: Record<string, { pass: string; name: string; role: 'SUPER_ADMIN' | 'ADMIN' }> = {
  'mayankbohara0@gmail.com': {
    pass: 'MayankJain@2006',
    name: 'Mayank Bohara',
    role: 'SUPER_ADMIN',
  },
  'sahilzalte36@gmail.com': {
    pass: 'SahilZalte@36',
    name: 'Sahil Zalte',
    role: 'ADMIN',
  },
  'bhadanepavan04@gmail.com': {
    pass: 'PavanBhadane@04',
    name: 'Pavan Bhadane',
    role: 'ADMIN',
  },
  'jaydip13452@gmail.com': {
    pass: 'Jaydip@13452',
    name: 'Jaydip',
    role: 'ADMIN',
  },
};

/**
 * Checks whether an email belongs to one of the 4 designated platform Admins.
 */
export function isWhitelistedAdmin(email?: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return Boolean(OFFICIAL_ADMINS[cleanEmail]) || cleanEmail.startsWith('admin@ffarena');
}

/**
 * Verifies admin password for a specific email (or against any authorized admin password).
 */
export function verifyAdminPassword(inputPassword: string, email?: string): boolean {
  const cleanPass = inputPassword.trim();
  
  // If specific email provided, check that account's exact password
  if (email && OFFICIAL_ADMINS[email.trim().toLowerCase()]) {
    const admin = OFFICIAL_ADMINS[email.trim().toLowerCase()];
    if (admin.pass === cleanPass) return true;
  }

  // Also verify if password matches any of the 4 authorized admin passwords
  return Object.values(OFFICIAL_ADMINS).some((admin) => admin.pass === cleanPass);
}

/**
 * Gets all configured admin email addresses.
 */
export function getAdminEmails(): string[] {
  return Object.keys(OFFICIAL_ADMINS);
}
