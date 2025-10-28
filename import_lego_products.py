
import json
import uuid
import os
import importlib.util

# load local helper module backend/scripts/supabase_rest.py dynamically
spec = importlib.util.spec_from_file_location('supabase_rest', os.path.join(os.path.dirname(__file__), 'backend', 'scripts', 'supabase_rest.py'))
supabase_rest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(supabase_rest)

# === Read products JSON ===
with open(os.path.join(os.path.dirname(__file__), 'lego_products_export.json'), 'r') as f:
    products = json.load(f)

# === Insert data via PostgREST ===
# Clear table (delete all rows) - BE CAREFUL: this is destructive
try:
    supabase_rest.delete('lego_products')
except Exception as e:
    print('Warning: could not delete existing rows via REST (check permissions):', e)

prepared = []
def img_url(name, idx=None):
    base = name.replace(' ', '+')
    if idx is None:
        return f'https://via.placeholder.com/280x280?text={base}'
    else:
        return f'https://via.placeholder.com/280x280?text={base}+{idx}'

for product in products:
    # Ensure each product has a unique UUID
    product_id = product.get('id')
    try:
        uuid.UUID(product_id)
    except Exception:
        product_id = str(uuid.uuid4())

    for i in range(5):
        key = 'pictures' if i == 0 else f'pictures_{i}'
        if not product.get(key) or product.get(key) == 'NaN':
            product[key] = img_url(product.get('name', 'Product'), None if i == 0 else i)

    row = {
        'id': product_id,
        'name': product.get('name'),
        'pictures': product.get('pictures'),
        'pictures_1': product.get('pictures_1'),
        'pictures_2': product.get('pictures_2'),
        'pictures_3': product.get('pictures_3'),
        'pictures_4': product.get('pictures_4'),
        'description': product.get('description'),
        'price_shipping_included': product.get('price_shipping_included'),
        'lego_pieces': int(product.get('lego_pieces')) if product.get('lego_pieces') else None,
    }
    prepared.append(row)

# Insert in batches (PostgREST accepts arrays)
try:
    chunk_size = 50
    for i in range(0, len(prepared), chunk_size):
        batch = prepared[i:i+chunk_size]
        supabase_rest.insert('lego_products', batch)
    print(f'Inserted {len(prepared)} rows into lego_products via PostgREST')
except Exception as e:
    print('Insert failed:', e)
