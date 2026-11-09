import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { parseQuery } from '../utils/http.js';

const router = Router();
const productQuery = z.object({
  search: z.string().trim().max(100).optional().default(''),
  category: z.string().trim().max(80).optional().default('')
});

router.get('/products', async (req, res) => {
  const { search, category } = parseQuery(productQuery, req.query);
  const result = await query(`
    SELECT id, name, brand, category, quantity, unit,
           CONCAT(quantity::text, ' ', unit) AS package_label
    FROM products
    WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR COALESCE(brand,'') ILIKE '%' || $1 || '%')
      AND ($2 = '' OR category = $2)
    ORDER BY name, id LIMIT 100
  `, [search, category]);
  res.json({ items: result.rows });
});

router.get('/shops', async (req, res) => {
  const { district } = parseQuery(z.object({district: z.string().trim().max(80).optional().default('')}), req.query);
  const result = await query(`
    SELECT id, name, city, district, address FROM shops
    WHERE ($1 = '' OR district = $1)
    ORDER BY district, city, name LIMIT 100
  `, [district]);
  res.json({ items: result.rows });
});

router.get('/districts', async (_req, res) => {
  const result = await query('SELECT DISTINCT district FROM shops ORDER BY district');
  res.json({ items: result.rows.map(row => row.district) });
});

router.get('/stats', async (_req, res) => {
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM products) AS product_count,
      (SELECT COUNT(*)::int FROM shops) AS shop_count,
      (SELECT COUNT(*)::int FROM price_reports WHERE status = 'APPROVED') AS approved_report_count,
      (SELECT COUNT(DISTINCT district)::int FROM shops) AS district_count
  `);
  res.json(result.rows[0]);
});

export default router;
