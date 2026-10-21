export const AUTH_KEY = 'tch8_verified';
export const LOGOUT_EVENT = 'tch8-logout';

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event(LOGOUT_EVENT));
}
