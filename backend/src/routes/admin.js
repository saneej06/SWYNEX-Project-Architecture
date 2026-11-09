import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { httpError, parseId, parseQuery } from '../utils/http.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/price-reports', async (req, res) => {
  const {status} = parseQuery(z.object({status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional().default('PENDING')}), req.query);
  const result = await query(`
    SELECT pr.id, pr.price_lkr, pr.observed_at, pr.submitted_at, pr.status,
           p.name AS product_name, s.name AS shop_name, u.name AS submitted_by_name
    FROM price_reports pr
    JOIN products p ON p.id = pr.product_id
    JOIN shops s ON s.id = pr.shop_id
    LEFT JOIN users u ON u.id = pr.submitted_by
    WHERE pr.status = $1 ORDER BY pr.submitted_at DESC LIMIT 100
  `, [status]);
  res.json({items: result.rows});
});

router.patch('/price-reports/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const {status} = parseQuery(z.object({status: z.enum(['APPROVED', 'REJECTED'])}), req.body);
  const result = await query(`
    UPDATE price_reports SET status = $1, reviewed_by = $2, reviewed_at = NOW()
    WHERE id = $3 AND status = 'PENDING'
    RETURNING id, status, reviewed_at
  `, [status, req.user.id, id]);
  if (!result.rowCount) throw httpError(404, 'Pending report not found (may already be reviewed).');
  res.json({report: result.rows[0]});
});

export default router;
