-- PricePulse (SWYNEX Task 01) | PostgreSQL 14+
-- Run against an EMPTY database named pricepulse.
-- Do not run the seed on a production database.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(80) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shops (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_reports (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  submitted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  price_lkr NUMERIC(12,2) NOT NULL CHECK (price_lkr > 0),
  observed_at DATE NOT NULL CHECK (observed_at <= CURRENT_DATE),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT review_consistency CHECK (
    (status = 'PENDING' AND reviewed_at IS NULL) OR
    (status IN ('APPROVED','REJECTED') AND reviewed_at IS NOT NULL) OR
    (is_demo = TRUE AND status = 'APPROVED')
  )
);

CREATE INDEX IF NOT EXISTS idx_reports_product_shop_date
  ON price_reports(product_id, shop_id, observed_at DESC, id DESC)
  WHERE status = 'APPROVED';
CREATE INDEX IF NOT EXISTS idx_reports_user ON price_reports(submitted_by, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON price_reports(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_shops_district ON shops(district);
