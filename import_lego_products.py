
import json
import psycopg2
import uuid

# === PostgreSQL connection configuration ===
DB_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "database": "lego_store",
    "user": "postgres",
    "password": "Lego@store1234"  # <-- Updated password to match docker-compose.yml
}

# === Step 1: Read JSON file ===
with open("/workspaces/store/lego_products_export.json", "r") as f:
    products = json.load(f)

# === Step 2: Connect to PostgreSQL ===
try:
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    print("Connected to PostgreSQL successfully.")
except Exception as e:
    print("Database connection failed:", e)
    exit()

# === Step 3: Create table (if not exists) ===
create_table_query = """
CREATE TABLE IF NOT EXISTS lego_products (
    id TEXT PRIMARY KEY,
    name TEXT,
    pictures TEXT,
    pictures_1 TEXT,
    pictures_2 TEXT,
    pictures_3 TEXT,
    pictures_4 TEXT,
    description TEXT,
    price_shipping_included TEXT,
    lego_pieces INTEGER
);
"""
cursor.execute(create_table_query)
conn.commit()
print("lego_products table is ready.")

# === Step 4: Insert data ===
cursor.execute("DELETE FROM lego_products;")  # Clear old data for fresh import
insert_query = """
    INSERT INTO lego_products (
        id, name, pictures, pictures_1, pictures_2, pictures_3, pictures_4,
        description, price_shipping_included, lego_pieces
    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s);
"""

for product in products:
    # Ensure each product has a unique UUID
    product_id = product.get("id")
    try:
        uuid.UUID(product_id)
    except Exception:
        product_id = str(uuid.uuid4())
    # Ensure image URLs are present
    def img_url(name, idx=None):
        base = name.replace(" ", "+")
        if idx is None:
            return f"https://via.placeholder.com/280x280?text={base}"
        else:
            return f"https://via.placeholder.com/280x280?text={base}+{idx}"
    for i in range(5):
        key = "pictures" if i == 0 else f"pictures_{i}"
        if not product.get(key) or product.get(key) == "NaN":
            product[key] = img_url(product["name"], None if i == 0 else i)
    cursor.execute(insert_query, (
        product_id,
        product.get("name"),
        product.get("pictures"),
        product.get("pictures_1"),
        product.get("pictures_2"),
        product.get("pictures_3"),
        product.get("pictures_4"),
        product.get("description"),
        product.get("price_shipping_included"),
        int(product.get("lego_pieces")) if product.get("lego_pieces") else None
    ))

conn.commit()
print(f"Inserted {len(products)} rows into lego_products table.")

# === Step 5: Close connection ===
cursor.close()
conn.close()
print("PostgreSQL connection closed successfully.")
