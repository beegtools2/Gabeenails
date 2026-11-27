const sessionKey = 'gabee_admin_session_v1';
const sessionDuration = 8 * 60 * 60 * 1000;

function readLegacyPassword(): string | null {
  try {
    const saved = localStorage.getItem('gabee_admin_password_v1');
    if (saved) return saved;
    const settings = JSON.parse(localStorage.getItem('gabee_nail_studio_settings_v1') ?? 'null');
    return typeof settings?.adminPassword === 'string' && settings.adminPassword ? settings.adminPassword : null;
  } catch {
    return null;
  }
}

const legacyPassword = readLegacyPassword();
export const hasLegacyAdminPassword = legacyPassword !== null;

function passwordMark(password: string) {
  let hash = 0;
  for (const character of password.split('')) {
    hash = (Math.imul(31, hash) + character.charCodeAt(0)) | 0;
  }
  return String(hash);
}

export function hasLegacyAdminSession() {
  if (!legacyPassword) return false;
  try {
    const session = JSON.parse(sessionStorage.getItem(sessionKey) ?? 'null');
    const age = Date.now() - Number(session?.authenticatedAt);
    return age >= 0 && age < sessionDuration && session?.passwordMark === passwordMark(legacyPassword);
  } catch {
    return false;
  }
}

export function loginLegacyAdmin(password: string) {
  if (!legacyPassword || password !== legacyPassword) return false;
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify({ authenticatedAt: Date.now(), passwordMark: passwordMark(legacyPassword) }));
  } catch {
    return true;
  }
  return true;
}

export function clearLegacyAdminSession() {
  try {
    sessionStorage.removeItem(sessionKey);
  } catch {
    return;
  }
}
