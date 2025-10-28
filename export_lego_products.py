import os
import json
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL') or os.environ.get('SUPABASE_API_URL')
SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE')

def fetch_and_save_json():
    if not SUPABASE_URL:
        print('SUPABASE_URL not set in environment')
        return
    url = SUPABASE_URL.rstrip('/') + '/rest/v1/lego_products?select=*'
    headers = {'apikey': SERVICE_ROLE or '', 'Authorization': f'Bearer {SERVICE_ROLE}'} if SERVICE_ROLE else {}
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    data = r.json()
    with open('lego_products_export.json', 'w') as f:
        json.dump(data, f, indent=2)
    print('Data exported to lego_products_export.json')

if __name__ == '__main__':
    fetch_and_save_json()
