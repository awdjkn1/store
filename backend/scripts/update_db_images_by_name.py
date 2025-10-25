"""
Update lego_products image fields by matching product name to folders under public/uploads/products/

This script scans public/uploads/products/<product_name>/ for image files and writes up to 5
image URLs into pictures, pictures_1, ... pictures_4 columns by matching the folder name to
the `name` column in the `lego_products` table (case-insensitive).

Usage:
  python backend/scripts/update_db_images_by_name.py

Make sure your DB settings in the script or environment variables are correct.
"""
import os
import psycopg2
from pathlib import Path

# DB config (pick from env or defaults)
DB_CONFIG = {
    'host': os.environ.get('PG_HOST', 'localhost'),
    'port': os.environ.get('PG_PORT', '5432'),
    'database': os.environ.get('PG_DATABASE', 'lego_store'),
    'user': os.environ.get('PG_USER', 'postgres'),
    'password': os.environ.get('PG_PASSWORD', 'Lego@store1234'),
}

UPLOAD_BASE = Path(__file__).resolve().parents[2] / 'public' / 'uploads' / 'products'

def find_images_for_folder(folder_path):
    exts = {'.png', '.jpg', '.jpeg', '.webp', '.gif'}
    files = [p for p in sorted(folder_path.iterdir()) if p.suffix.lower() in exts]
    return [f"/uploads/products/{folder_path.name}/{p.name}" for p in files]

def main():
    if not UPLOAD_BASE.exists():
        print('No uploads found at', UPLOAD_BASE)
        return

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    for folder in UPLOAD_BASE.iterdir():
        if not folder.is_dir():
            continue
        product_name = folder.name
        urls = find_images_for_folder(folder)
        if not urls:
            print(f'No images in folder {folder}, skipping')
            continue

        # Find product by name (case-insensitive). Use exact match first, then ILIKE fallback.
        cur.execute('SELECT id, name FROM lego_products WHERE name = %s', (product_name,))
        row = cur.fetchone()
        if not row:
            cur.execute('SELECT id, name FROM lego_products WHERE name ILIKE %s LIMIT 1', (product_name,))
            row = cur.fetchone()
        if not row:
            print(f'No product found matching name "{product_name}", skipping')
            continue

        product_id = row[0]
        values = [None] * 5
        for i in range(min(5, len(urls))):
            values[i] = urls[i]

        cur.execute(
            'UPDATE lego_products SET pictures=%s, pictures_1=%s, pictures_2=%s, pictures_3=%s, pictures_4=%s WHERE id=%s RETURNING id',
            (*values, product_id)
        )
        print(f'Updated product {product_id} ({row[1]}) with {min(5,len(urls))} image(s)')
        conn.commit()

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
