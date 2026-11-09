# PricePulse REST API Reference

**Base:** `http://localhost:4000/api`  
All JSON POST/PATCH requests: `Content-Type: application/json`.

Protected requests: `Authorization: Bearer <your_token>`.

## Public routes

| HTTP | Endpoint | Query or body | Success |
|---|---|---|---|
| GET | `/health` | — | 200, `status: ok` |
| POST | `/auth/register` | `{name, email, password}` | 201, `{token,user}` |
| POST | `/auth/login` | `{email, password}` | 200, `{token,user}` |
| GET | `/products` | `?search=rice&category=Rice%20%26%20Grains` (optional) | 200, `{items:[...]}` |
| GET | `/shops` | `?district=Batticaloa` (optional) | 200, `{items:[...]}` |
| GET | `/districts` | — | 200, `{items:["..."]}` |
| GET | `/stats` | — | 200, counts |
| GET | `/prices/compare` | `?productId=1&district=Batticaloa` | 200, product and price `items` |
| GET | `/prices/history` | `?productId=1&shopId=2` (shopId optional) | 200, `{items:[...]}` |

## Authenticated-user routes

| HTTP | Endpoint | Body | Success |
|---|---|---|---|
| GET | `/auth/me` | — | 200, `{user}` |
| POST | `/price-reports` | `{product_id, shop_id, price_lkr, observed_at}` | 201, `{message,report}` |
| GET | `/my/price-reports` | — | 200, `{items:[...]}` |

`observed_at` uses `YYYY-MM-DD`, must be a valid date and cannot be in the future. Prices are in LKR, positive, max 1,000,000 per report in this starter. New reports start as `PENDING`.

Example:

```json
{
  "product_id": 1,
  "shop_id": 2,
  "price_lkr": 246.50,
  "observed_at": "2026-10-30"
}
```

## Admin routes

| HTTP | Endpoint | Body / query | Success |
|---|---|---|---|
| GET | `/admin/price-reports` | `?status=PENDING` (default), `APPROVED`, `REJECTED` | 200, reports |
| PATCH | `/admin/price-reports/:id` | `{ "status": "APPROVED" }` or `{ "status": "REJECTED" }` | 200, updated report |

Only pending reports may be updated. Neither endpoint is available to normal USER accounts.

## Examples with curl

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/products
curl 'http://localhost:4000/api/prices/compare?productId=1&district=Batticaloa'
```

Register (example):

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo User","email":"demo@example.com","password":"aStrongPassword123"}'
```

Use the returned JWT as a bearer token; do not publish it.

## Error format

Errors return `{ "error": "Readable message" }` with standard HTTP statuses:

- `400` — invalid input
- `401` — authentication required / invalid credentials
- `403` — admin access required
- `404` — not found or no pending report to update
- `409` — duplicate email
- `500` — internal server error (no stack or database credentials revealed)

## Accuracy note

The initial `database/seed.sql` entries are fabricated for demonstration. They do not constitute market research or verifiable offers. Price reports are community-supplied and may become outdated; moderators do not necessarily check against a real receipt at this starter stage.
