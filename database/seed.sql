-- ILLUSTRATIVE DATA ONLY. These are invented demo prices, NOT verified Sri Lankan market prices.
-- Run once on the empty database after schema.sql.

INSERT INTO products (name, brand, category, quantity, unit) VALUES
('White Rice', NULL, 'Rice & Grains', 1, 'kg'),
('Red Rice', NULL, 'Rice & Grains', 1, 'kg'),
('White Sugar', NULL, 'Essentials', 1, 'kg'),
('Dhal', NULL, 'Rice & Grains', 1, 'kg'),
('Coconut Oil', NULL, 'Cooking', 1, 'L'),
('Wheat Flour', NULL, 'Baking', 1, 'kg'),
('Milk Powder', 'Demo Brand', 'Dairy', 400, 'g'),
('Tea Powder', 'Demo Brand', 'Beverages', 200, 'g');

INSERT INTO shops (name, address, city, district) VALUES
('Market One', 'Demo address', 'Batticaloa', 'Batticaloa'),
('Market Two', 'Demo address', 'Eravur', 'Batticaloa'),
('Market Three', 'Demo address', 'Anuradhapura', 'Anuradhapura'),
('Market Four', 'Demo address', 'Polonnaruwa', 'Polonnaruwa');

-- Demo prices are intentionally made-up; do not present them as live offers.
INSERT INTO price_reports (product_id, shop_id, price_lkr, observed_at, status, is_demo)
SELECT p.id, s.id,
  CASE
    WHEN p.name = 'White Rice' THEN 220 + s.id * 8
    WHEN p.name = 'Red Rice' THEN 255 + s.id * 5
    WHEN p.name = 'White Sugar' THEN 238 + s.id * 7
    WHEN p.name = 'Dhal' THEN 340 + s.id * 9
    WHEN p.name = 'Coconut Oil' THEN 770 + s.id * 12
    WHEN p.name = 'Wheat Flour' THEN 195 + s.id * 6
    WHEN p.name = 'Milk Powder' THEN 980 + s.id * 11
    ELSE 420 + s.id * 10
  END,
  CURRENT_DATE - ((s.id % 4)::int), 'APPROVED', TRUE
FROM products p CROSS JOIN shops s;
