/**
 * Contraseña del panel /admin.
 *
 * Fuente de verdad (en orden de prioridad):
 * 1. Una clave dedicada en localStorage, escrita al guardar "Configuración y Tarifas".
 * 2. El campo `adminPassword` dentro de los ajustes persistidos del estudio.
 * 3. El valor inicial "1234".
 *
 * Esto permite que el cambio de contraseña se aplique de inmediato aunque
 * Firestore no responda, y que el login NO dependa de ningún endpoint.
 */

export const DEFAULT_ADMIN_PASSWORD = '1234';
export const ADMIN_PASSWORD_STORAGE_KEY = 'gabee_admin_password_v1';
export const SETTINGS_STORAGE_KEY = 'gabee_nail_studio_settings_v1';
const ADMIN_SESSION_STORAGE_KEY = 'gabee_admin_session_v1';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

function readSettingsPassword(): string | null {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const value = parsed?.adminPassword;
    return typeof value === 'string' && value ? value : null;
  } catch {
    return null;
  }
}

export function getAdminPassword(): string {
  try {
    const dedicated = localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY);
    if (dedicated) return dedicated;
  } catch {
    // ignore
  }
  return readSettingsPassword() || DEFAULT_ADMIN_PASSWORD;
}

/** Guarda la clave dedicada. Los ajustes ya la guardan por su parte en Firestore. */
export function persistAdminPassword(password: string): void {
  try {
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, password);
  } catch {
    // ignore
  }
}

export function checkAdminPassword(input: string): boolean {
  return input === getAdminPassword();
}

/** Hash simple solo para invalidar la sesión si la contraseña cambia. */
export function getPasswordMark(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i += 1) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function createAdminSession(): void {
  const mark = getPasswordMark(getAdminPassword());
  try {
    sessionStorage.setItem(
      ADMIN_SESSION_STORAGE_KEY,
      JSON.stringify({ authenticatedAt: Date.now(), passwordMark: mark })
    );
  } catch {
    // ignore
  }
}

export function isAdminSessionValid(): boolean {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    const authenticatedAt = Number(session?.authenticatedAt);
    if (!Number.isFinite(authenticatedAt)) return false;
    if (Date.now() - authenticatedAt >= SESSION_DURATION_MS) {
      clearAdminSession();
      return false;
    }
    return session?.passwordMark === getPasswordMark(getAdminPassword());
  } catch {
    return false;
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
