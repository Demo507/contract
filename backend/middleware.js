export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const lc = (a) => String(a || '').trim().toLowerCase();

export function isAdminReq(req) {
  const key = process.env.ADMIN_KEY;
  return Boolean(key) && req.get('x-admin-key') === key;
}

export function requireAdmin(req, res, next) {
  if (!isAdminReq(req)) return res.status(403).json({ error: 'Admin key required' });
  next();
}
