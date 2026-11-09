import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

const { ADMIN_NAME = 'PricePulse Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in backend/.env.');
  process.exit(1);
}
try {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const result = await query(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, 'ADMIN')
    ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', password_hash = EXCLUDED.password_hash
    RETURNING id, email, role
  `, [ADMIN_NAME, ADMIN_EMAIL.trim().toLowerCase(), hashed]);
  console.log('Admin account configured:', result.rows[0].email);
} catch (error) {
  console.error('Admin setup failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
