import os
import requests
from urllib.parse import urlencode

SUPABASE_URL = os.environ.get('SUPABASE_URL') or os.environ.get('SUPABASE_API_URL')
SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL:
    raise SystemExit('SUPABASE_URL is not set in environment')

BASE = SUPABASE_URL.rstrip('/') + '/rest/v1'
HEADERS = {
    'Content-Type': 'application/json',
}
if SERVICE_ROLE:
    HEADERS['Authorization'] = f'Bearer {SERVICE_ROLE}'
    HEADERS['apikey'] = SERVICE_ROLE


def build_qs(params: dict):
    if not params:
        return ''
    return '?' + urlencode(params, doseq=True)


def request(method, path, params=None, json=None, extra_headers=None):
    url = f"{BASE}/{path.lstrip('/')}{build_qs(params)}"
    headers = HEADERS.copy()
    if extra_headers:
        headers.update(extra_headers)
    resp = requests.request(method, url, headers=headers, json=json, timeout=30)
    if not resp.ok:
        raise RuntimeError(f"Supabase REST {method} {url} -> {resp.status_code}: {resp.text}")
    # Try to return json when available
    if resp.text:
        try:
            return resp.json()
        except Exception:
            return resp.text
    return None


def select(table, params=None):
    return request('GET', f'{table}', params=params or {})


def insert(table, rows, params=None):
    return request('POST', f'{table}', params=params or {}, json=rows if isinstance(rows, list) else [rows])


def upsert(table, rows, params=None):
    return request('POST', f'{table}', params=params or {}, json=rows if isinstance(rows, list) else [rows])


def patch(table, data, params=None):
    return request('PATCH', f'{table}', params=params or {}, json=data)


def delete(table, params=None):
    return request('DELETE', f'{table}', params=params or {})


def rpc(fn_name, payload=None):
    return request('POST', f'rpc/{fn_name}', json=payload or {})
