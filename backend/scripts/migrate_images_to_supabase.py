#!/usr/bin/env python3
"""Migrate images from local `public/uploads/products/` to Supabase Storage
and insert corresponding rows into the `product_images` table in Postgres.

Usage:
  SUPABASE_URL=yourproject.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
  PG_HOST=db.yourproject.supabase.co PG_PORT=5432 PG_DATABASE=postgres PG_USER=postgres PG_PASSWORD=<pwd> \
  python backend/scripts/migrate_images_to_supabase.py --bucket product-images

Notes:
- The script expects the images to exist under `public/uploads/products/<product_id>/*`.
- It will upload files to the provided bucket preserving folder structure.
- Uploaded files will be available under the public storage URL:
  https://<SUPABASE_URL>/storage/v1/object/public/<bucket>/<path>
"""
import os
import sys
import mimetypes
import argparse
from pathlib import Path

try:
    from dotenv import load_dotenv
    DOTENV = True
except Exception:
    DOTENV = False

import requests
import importlib.util
import os
spec = importlib.util.spec_from_file_location('supabase_rest', os.path.join(os.path.dirname(__file__), 'supabase_rest.py'))
supabase_rest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(supabase_rest)


ROOT = Path(__file__).resolve().parents[2]
UPLOAD_BASE = ROOT / 'public' / 'uploads' / 'products'


def load_env():
    if DOTENV:
        env_path = ROOT / '.env'
        if env_path.exists():
            load_dotenv(env_path)


# No direct DB connection helper - we use PostgREST to insert product_images


def upload_file_to_supabase(supabase_host, service_key, bucket, object_path, data, content_type):
    """Upload binary data to Supabase Storage bucket at object_path.
    Uses the storage API and Service Role Key.
    """
    # Primary URL: upload to the exact object path
    url = f"https://{supabase_host}/storage/v1/object/{bucket}/{object_path}"
    headers = {
        'Authorization': f'Bearer {service_key}',
        'x-upsert': 'true',
        'Content-Type': content_type or 'application/octet-stream'
    }
    resp = requests.post(url, headers=headers, data=data)
    if resp.status_code in (200, 201, 204):
        return True
    # Fallback: POST to bucket with path param
    url2 = f"https://{supabase_host}/storage/v1/object/{bucket}"
    params = {'path': object_path}
    resp2 = requests.post(url2, headers=headers, params=params, data=data)
    if resp2.status_code in (200, 201, 204):
        return True
    raise RuntimeError(f'Upload failed: {resp.status_code} {resp.text} | fallback: {resp2.status_code} {resp2.text}')


def public_url(supabase_host, bucket, object_path):
    return f"https://{supabase_host}/storage/v1/object/public/{bucket}/{object_path}"


def migrate(bucket, supabase_host, service_key, dry_run=False):
    if not UPLOAD_BASE.exists():
        print('No uploads directory found at', UPLOAD_BASE)
        return

    # No direct DB connection required; we will insert product_images via PostgREST
    conn = None

    uploaded = 0
    inserted = 0
    errors = []

    try:
        for folder in sorted(UPLOAD_BASE.iterdir()):
            if not folder.is_dir():
                continue
            product_id = folder.name
            for f in sorted(folder.iterdir()):
                if not f.is_file():
                    continue
                ct, _ = mimetypes.guess_type(str(f))
                with open(f, 'rb') as fh:
                    data = fh.read()
                object_path = f"{product_id}/{f.name}"
                try:
                    if dry_run:
                        print(f'[dry-run] would upload {f} -> {object_path}')
                    else:
                        upload_file_to_supabase(supabase_host, service_key, bucket, object_path, data, ct)
                        uploaded += 1
                        # insert via PostgREST
                        img_url = public_url(supabase_host, bucket, object_path)
                        try:
                            supabase_rest.insert('product_images', {'product_id': product_id, 'image_url': img_url})
                            inserted += 1
                        except Exception as e:
                            errors.append((str(f), str(e)))
                            print('Error inserting product_images row', e)
                except Exception as e:
                    errors.append((str(f), str(e)))
                    print('Error uploading', f, e)
    finally:
        if conn:
            conn.close()

    print('Migration summary:')
    print('  uploaded:', uploaded)
    print('  inserted:', inserted)
    if errors:
        print('  errors:', len(errors))
        for e in errors[:10]:
            print('   ', e)


def main():
    load_env()
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket', default='product-images', help='Supabase storage bucket name')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    supabase_host = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not supabase_host or not service_key:
        print('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment')
        sys.exit(2)

    print('Starting migration to Supabase storage (public bucket):', args.bucket)
    migrate(args.bucket, supabase_host, service_key, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
