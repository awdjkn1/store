-- Migrate product_images.product_id from product name to canonical product ID
-- This script updates product_images so product_id matches lego_products.id
-- Only updates rows where product_id is currently a product name

UPDATE product_images
SET product_id = lego_products.id
FROM lego_products
WHERE product_images.product_id = lego_products.name
  AND product_images.product_id <> lego_products.id;

-- You can verify with:
-- SELECT * FROM product_images WHERE product_id NOT IN (SELECT id FROM lego_products);
