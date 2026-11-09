import 'dotenv/config';
import app from './app.js';
import { pool } from './config/db.js';

for (const required of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[required]) {
    console.error(`Missing ${required}. Copy .env.example to .env and configure it.`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters.');
  process.exit(1);
}
const port = Number(process.env.PORT || 4000);
try {
  await pool.query('SELECT 1');
  app.listen(port, () => console.log(`PricePulse API ready at http://localhost:${port}`));
} catch (error) {
  console.error('Could not connect to PostgreSQL:', error.message);
  await pool.end();
  process.exit(1);
}
