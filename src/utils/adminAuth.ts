/**
 * RXM Automobile — Admin Authentication & Security Helper
 * Asigură transmiterea token-ului de autorizare către API pentru toate operațiunile de mutație
 */

export const ADMIN_AUTH_TOKEN_KEY = 'rxm_admin_session_token';
export const ADMIN_AUTH_FLAG_KEY = 'rxm_admin_authenticated';

/**
 * Returnează header-ul de autorizare dacă administratorul este autentificat în sesiune.
 * Dacă vizitatorul nu este admin, returnează obiect gol (refuzat automat de backend la scriere).
 */
export function getAdminAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const isAuth = sessionStorage.getItem(ADMIN_AUTH_FLAG_KEY) === 'true';
    const token = sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY);

    if (isAuth && token) {
      return {
        'Authorization': `Bearer ${token}`,
        'X-Admin-Token': token,
      };
    }
  } catch {
    // sessionStorage indisponibil
  }

  return {};
}

/**
 * Verifică dacă utilizatorul curent are o sesiune de admin validă în browser
 */
export function isCurrentSessionAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(ADMIN_AUTH_FLAG_KEY) === 'true' && 
      Boolean(sessionStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
  } catch {
    return false;
  }
}
