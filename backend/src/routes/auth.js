import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db.js';
import { httpError, parseQuery } from '../utils/http.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const credentials = z.object({
  email: z.string().email().max(255).transform(s => s.trim().toLowerCase()),
  password: z.string().min(8).max(128)
});
const registerSchema = credentials.extend({name: z.string().trim().min(2).max(100)});

function makeSession(user) {
  return {
    token: jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
      subject: String(user.id), expiresIn: '8h', algorithm: 'HS256'
    }),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  };
}

router.post('/register', async (req, res) => {
  const {name, email, password} = parseQuery(registerSchema, req.body);
  const existing = await query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount) throw httpError(409, 'This email address is already registered.');
  const hashed = await bcrypt.hash(password, 12);
  try {
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashed]
    );
    res.status(201).json(makeSession(result.rows[0]));
  } catch (error) {
    if (error.code === '23505') throw httpError(409, 'This email address is already registered.');
    throw error;
  }
});

router.post('/login', async (req, res) => {
  const {email, password} = parseQuery(credentials, req.body);
  const result = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1', [email]
  );
  const user = result.rows[0];
  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    throw httpError(401, 'Invalid email or password.');
  }
  res.json(makeSession(user));
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
  if (!result.rowCount) throw httpError(401, 'Account no longer exists.');
  res.json({ user: result.rows[0] });
});

export default router;
