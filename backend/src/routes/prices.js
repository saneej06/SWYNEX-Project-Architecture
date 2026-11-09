import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { httpError, parseId, parseQuery } from '../utils/http.js';

const router = Router();
const paramsSchema = z.object({
  productId: z.coerce.number().int().positive(),
  district: z.string().trim().max(80).optional().default('')
});

router.get('/prices/compare', async (req, res) => {
  const { productId, district } = parseQuery(paramsSchema, req.query);
  const productResult = await query('SELECT id, name, brand, category, quantity, unit FROM products WHERE id = $1', [productId]);
  if (!productResult.rowCount) throw httpError(404, 'Product not found.');
  const result = await query(`
    SELECT newest.shop_id, s.name AS shop_name, s.city, s.district,
           newest.price_lkr, newest.observed_at, newest.is_demo
    FROM (
      SELECT DISTINCT ON (shop_id) shop_id, price_lkr, observed_at, is_demo
      FROM price_reports
      WHERE product_id = $1 AND status = 'APPROVED'
      ORDER BY shop_id, observed_at DESC, reviewed_at DESC NULLS LAST, id DESC
    ) AS newest
    JOIN shops s ON s.id = newest.shop_id
    WHERE ($2 = '' OR s.district = $2)
    ORDER BY newest.price_lkr ASC, s.name ASC
  `, [productId, district]);
  res.json({ product: productResult.rows[0], district, items: result.rows });
});

router.get('/prices/history', async (req, res) => {
  const {productId, shopId} = parseQuery(z.object({
    productId: z.coerce.number().int().positive(),
    shopId: z.coerce.number().int().positive().optional()
  }), req.query);
  const result = await query(`
    SELECT p.id, p.price_lkr, p.observed_at, p.is_demo, s.name AS shop_name
    FROM price_reports p JOIN shops s ON s.id = p.shop_id
    WHERE p.product_id = $1 AND p.status = 'APPROVED' AND ($2::int IS NULL OR p.shop_id = $2)
    ORDER BY p.observed_at DESC, p.id DESC LIMIT 50
  `, [productId, shopId ?? null]);
  res.json({items: result.rows});
});

const reportSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  shop_id: z.coerce.number().int().positive(),
  price_lkr: z.coerce.number().positive().max(1000000),
  observed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD date format.')
});

router.post('/price-reports', requireAuth, async (req, res) => {
  const input = parseQuery(reportSchema, req.body);
  const [product, shop] = await Promise.all([
    query('SELECT 1 FROM products WHERE id = $1', [input.product_id]),
    query('SELECT 1 FROM shops WHERE id = $1', [input.shop_id])
  ]);
  if (!product.rowCount || !shop.rowCount) throw httpError(400, 'Select an existing product and shop.');
  const date = new Date(`${input.observed_at}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.observed_at || date > new Date()) {
    throw httpError(400, 'Observation date must be a real date, not in the future.');
  }
  const result = await query(`
    INSERT INTO price_reports (product_id, shop_id, submitted_by, price_lkr, observed_at)
    VALUES ($1, $2, $3, $4, $5) RETURNING id, status, submitted_at
  `, [input.product_id, input.shop_id, req.user.id, input.price_lkr, input.observed_at]);
  res.status(201).json({message: 'Price report submitted for review.', report: result.rows[0]});
});

router.get('/my/price-reports', requireAuth, async (req, res) => {
  const result = await query(`
    SELECT pr.id, pr.price_lkr, pr.observed_at, pr.submitted_at, pr.status,
           p.name AS product_name, s.name AS shop_name
    FROM price_reports pr
    JOIN products p ON p.id = pr.product_id
    JOIN shops s ON s.id = pr.shop_id
    WHERE pr.submitted_by = $1 ORDER BY pr.submitted_at DESC LIMIT 100
  `, [req.user.id]);
  res.json({items: result.rows});
});

export default router;
