#!/usr/bin/env python3
"""Import `lego_products_export.json` into Supabase via PostgREST (REST API).

Usage:
  # dry-run (default)
  python import_lego_products_rest.py

  # to actually POST to Supabase
  python import_lego_products_rest.py --execute

Environment variables:
  SUPABASE_HOST_DOMAIN  (e.g. ahjtxhsyymbnikbowrdc.supabase.co)
  SUPABASE_SERVICE_ROLE_KEY
  (optional) INPUT_PATH (defaults to ./lego_products_export.json)

This script posts products in batches to the /rest/v1/lego_products endpoint
using the service_role key for authorization. It uses `on_conflict=id` to upsert
based on the `id` column.
"""
import os
import json
import argparse
from urllib.parse import urljoin

import requests


def load_products(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def chunked(it, size):
    for i in range(0, len(it), size):
        yield it[i:i+size]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true', help='Actually POST to Supabase')
    # deprecated: removed direct DB fallback to force REST-only import
    parser.add_argument('--input', default=os.environ.get('INPUT_PATH', os.path.join(os.getcwd(), 'lego_products_export.json')))
    parser.add_argument('--batch', type=int, default=100, help='Batch size for POST')
    args = parser.parse_args()

    host = os.environ.get('SUPABASE_HOST_DOMAIN') or os.environ.get('SUPABASE_URL')
    svc_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not host or not svc_key:
        print('Missing SUPABASE_HOST_DOMAIN (or SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY in env')
        return

    products = load_products(args.input)
    print(f'Loaded {len(products)} products from {args.input}')

    # Normalize timestamp fields: Supabase/Postgres expects timestamp strings
    # not millisecond epochs. Convert common fields if they're numeric.
    from datetime import datetime
    def normalize_ts(v):
        # treat large ints as milliseconds
        try:
            if isinstance(v, int) or (isinstance(v, float) and v > 1):
                if v > 1e12:  # milliseconds
                    return datetime.utcfromtimestamp(v / 1000.0).isoformat() + 'Z'
                else:
                    return datetime.utcfromtimestamp(v).isoformat() + 'Z'
        except Exception:
            pass
        return v

    for p in products:
        if 'created_at' in p:
            p['created_at'] = normalize_ts(p['created_at'])
        if 'updated_at' in p:
            p['updated_at'] = normalize_ts(p['updated_at'])

    rest_url = f'https://{host}/rest/v1/lego_products'
    headers = {
        'apikey': svc_key,
        'Authorization': f'Bearer {svc_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }

    if not args.execute:
        print('Dry-run mode. To actually POST, run with --execute')
        sample = products[: min(5, len(products))]
        print('Sample payload (first 3):')
        print(json.dumps(sample[:3], indent=2)[:2000])
        return

    # Direct DB fallback removed. This script uses PostgREST (REST) only.

    # Post in batches using on_conflict=id to upsert (REST fallback)
    for batch in chunked(products, args.batch):
        params = {'on_conflict': 'id'}
        resp = requests.post(rest_url, headers=headers, params=params, json=batch, timeout=60)
        if not resp.ok:
            # Handle duplicate-key conflicts gracefully (already inserted)
            if resp.status_code == 409 and 'duplicate key' in (resp.text or '').lower():
                print('Batch conflict (duplicate keys) - records likely already exist; skipping batch')
                continue
            print('Batch POST failed:', resp.status_code, resp.text)
            raise SystemExit(1)
        print('Batch posted, count=', len(batch), 'response=', resp.status_code)


if __name__ == '__main__':
    main()
