import jwt from 'jsonwebtoken';
import { httpError } from '../utils/http.js';

export function requireAuth(req, _res, next) {
  const authHeader = req.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return next(httpError(401, 'Please sign in first.'));
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!Number.isSafeInteger(Number(payload.sub)) || Number(payload.sub) <= 0 || !['USER', 'ADMIN'].includes(payload.role)) {
      throw new Error('Invalid token claims');
    }
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return next(httpError(401, 'Your session has expired. Please sign in again.'));
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'ADMIN') return next(httpError(403, 'Admin access required.'));
  return next();
}
