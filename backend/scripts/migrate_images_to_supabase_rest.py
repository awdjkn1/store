#!/usr/bin/env python3
"""Upload product images from `public/uploads/products/*` to Supabase Storage via HTTPS
and insert rows into `product_images` using PostgREST.

Usage:
  # dry-run (default)
  python migrate_images_to_supabase_rest.py

  # to actually upload and insert
  python migrate_images_to_supabase_rest.py --execute

Environment variables:
  SUPABASE_HOST_DOMAIN
  SUPABASE_SERVICE_ROLE_KEY
  IMAGE_ROOT (optional, default: ./public/uploads/products)
  BUCKET (optional, default: product-images)

This script uploads files under IMAGE_ROOT/<product_id>/* to the bucket under
the same path, then posts a row to /rest/v1/product_images with the public URL.
"""
import os
import argparse
import requests
from pathlib import Path

# Optional boto3 support for S3-compatible uploads (Supabase S3 endpoint)
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:
    boto3 = None


def iter_images(root: Path):
    # expect structure: root/<product_id>/*.jpg
    for product_dir in sorted(root.iterdir()):
        if not product_dir.is_dir():
            continue
        product_id = product_dir.name
        for img in sorted(product_dir.iterdir()):
            if img.is_file():
                yield product_id, img


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--image-root', default=os.environ.get('IMAGE_ROOT', os.path.join(os.getcwd(), 'public', 'uploads', 'products')))
    parser.add_argument('--bucket', default=os.environ.get('BUCKET', 'product-images'))
    args = parser.parse_args()

    host = os.environ.get('SUPABASE_HOST_DOMAIN') or os.environ.get('SUPABASE_URL')
    svc_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not host or not svc_key:
        print('Missing SUPABASE_HOST_DOMAIN (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in env')
        return

    image_root = Path(args.image_root)
    if not image_root.exists():
        print('Image root does not exist:', image_root)
        return

    # Allow an explicit storage endpoint (S3-style or alternate) via env
    storage_env = os.environ.get('SUPABASE_STORAGE_URL') or os.environ.get('STORAGE_BASE_URL')
    if storage_env:
        storage_env = storage_env.rstrip('/')
        # If the provided URL already contains /storage/v1, use as-is with /object/<bucket>
        if '/storage/v1' in storage_env:
            if storage_env.endswith('/storage/v1'):
                storage_url = storage_env + f'/object/{args.bucket}/'
            else:
                storage_url = storage_env + f'/object/{args.bucket}/'
        else:
            storage_url = storage_env + f'/storage/v1/object/{args.bucket}/'
    else:
        # Default Supabase storage object endpoint
        storage_url = f'https://{host}/storage/v1/object/{args.bucket}/'
    rest_url = f'https://{host}/rest/v1/product_images'
    headers_auth = {
        'apikey': svc_key,
        'Authorization': f'Bearer {svc_key}',
    }

    # Ensure bucket exists (create if needed). Requires service_role key.
    buckets_url = f'https://{host}/storage/v1/bucket'
    try:
        create_resp = requests.post(buckets_url, headers={**headers_auth, 'Content-Type': 'application/json'}, json={'name': args.bucket, 'public': True}, timeout=30)
        if create_resp.status_code in (200, 201):
            print('Created bucket', args.bucket)
        elif create_resp.status_code == 409:
            print('Bucket already exists:', args.bucket)
        else:
            print('Bucket create response:', create_resp.status_code, create_resp.text)
    except Exception as e:
        print('Bucket create request failed:', e)

    if not args.execute:
        print('Dry-run. Files found:')
        count = 0
        for pid, img in iter_images(image_root):
            print(pid, img)
            count += 1
            if count >= 10:
                break
        print('... stopping sample list. To perform upload run with --execute')
        return

    # Detect S3-style endpoint and credentials
    s3_endpoint = os.environ.get('SUPABASE_STORAGE_URL') or os.environ.get('S3_ENDPOINT')
    s3_key = os.environ.get('SUPABASE_S3_ACCESS_KEY') or os.environ.get('S3_ACCESS_KEY')
    s3_secret = os.environ.get('SUPABASE_S3_SECRET') or os.environ.get('S3_SECRET')
    use_s3 = bool(s3_endpoint and s3_key and s3_secret and boto3)
    if use_s3:
        # configure boto3 client for S3-compatible endpoint
        s3_client = boto3.client('s3', endpoint_url=s3_endpoint, aws_access_key_id=s3_key, aws_secret_access_key=s3_secret)
        print('Using S3-compatible upload via boto3 to', s3_endpoint)

    for product_id, imgpath in iter_images(image_root):
        dest_path = f'{product_id}/{imgpath.name}'
        print('Uploading', imgpath, '->', dest_path)
        if use_s3:
            try:
                s3_client.upload_file(str(imgpath), args.bucket, dest_path, ExtraArgs={'ACL': 'public-read', 'CacheControl': 'max-age=3600'})
                public_url = f'https://{host}/storage/v1/object/public/{args.bucket}/{dest_path}'
                print('S3 upload succeeded for', imgpath)
            except (BotoCoreError, ClientError) as e:
                print('S3 upload failed for', imgpath, e)
                continue
        else:
            params = {'cacheControl': '3600', 'upsert': 'true', 'name': dest_path}
            with open(imgpath, 'rb') as fh:
                files = {'file': (imgpath.name, fh)}
                resp = requests.post(storage_url, headers=headers_auth, params=params, files=files, timeout=120)
            if not resp.ok:
                print('Upload failed for', imgpath, resp.status_code, resp.text)
                continue
            public_url = f'https://{host}/storage/v1/object/public/{args.bucket}/{dest_path}'

        # Insert into product_images via PostgREST
        # product_id may be a UUID (or other string); do not cast to int
        payload = {
            'product_id': product_id,
            'image_url': public_url
        }
        r2 = requests.post(rest_url, headers={**headers_auth, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}, json=payload, timeout=30)
        if not r2.ok:
            print('Failed to insert product_images row for', product_id, imgpath.name, r2.status_code, r2.text)
        else:
            print('Inserted product_images row for', product_id, imgpath.name)


if __name__ == '__main__':
    main()
