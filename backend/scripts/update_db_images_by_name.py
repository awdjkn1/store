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
import importlib.util
from pathlib import Path

# dynamic import of supabase_rest helper
spec = importlib.util.spec_from_file_location('supabase_rest', os.path.join(os.path.dirname(__file__), 'supabase_rest.py'))
supabase_rest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(supabase_rest)

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

    for folder in UPLOAD_BASE.iterdir():
        if not folder.is_dir():
            continue
        product_name = folder.name
        urls = find_images_for_folder(folder)
        if not urls:
            print(f'No images in folder {folder}, skipping')
            continue
        # Find product by name (exact match first)
        rows = supabase_rest.select('lego_products', params={'select': 'id,name', 'name': f'eq.{product_name}'})
        if not rows:
            rows = supabase_rest.select('lego_products', params={'select': 'id,name', 'name': f'ilike.%{product_name}%', 'limit': '1'})
        if not rows:
            print(f'No product found matching name "{product_name}", skipping')
            continue
        product_id = rows[0]['id']
        fields = {}
        for i in range(min(5, len(urls))):
            key = 'pictures' if i == 0 else f'pictures_{i}'
            fields[key] = urls[i]
        try:
            supabase_rest.patch('lego_products', fields, params={'id': f'eq.{product_id}'})
            print(f'Updated product {product_id} ({rows[0].get("name")}) with {min(5,len(urls))} image(s)')
        except Exception as e:
            print('Failed to update product images for', product_id, e)

if __name__ == '__main__':
    main()
