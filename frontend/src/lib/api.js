import { BACKEND_URL } from '../contracts/addresses.js';

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  let res;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. On free hosting it sleeps when idle: wait 30 seconds and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* not json */ }
  if (!res.ok) throw new Error(data?.error || `Server error (${res.status})`);
  return data;
}

// Ask the backend to read the order from the blockchain and save its real status.
export const syncOrder = (orderId, extra = {}) =>
  api(`/api/orders/${orderId}/sync`, { method: 'POST', body: extra });
