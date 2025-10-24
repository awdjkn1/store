import pandas as pd
import psycopg2
from psycopg2 import sql

# === PostgreSQL connection configuration ===
DB_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "database": "lego_store",
    "user": "postgres",
    "password": "Lego@store1234"  # <-- Updated password
}

# === Step 1: Read Excel file ===
df = pd.read_excel("/workspaces/store/lego spreadsheet.xlsx")

# Clean up column names (remove spaces/newlines)
df.columns = [col.strip().replace(" ", "_").replace("\n", "_") for col in df.columns]

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
    id SERIAL PRIMARY KEY,
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
insert_query = sql.SQL("""
    INSERT INTO lego_products (
        name, pictures, pictures_1, pictures_2, pictures_3, pictures_4,
        description, price_shipping_included, lego_pieces
    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s);
""")

for _, row in df.iterrows():
    cursor.execute(insert_query, (
        row.get("Name"),
        row.get("pictures"),
        row.get("pictures.1"),
        row.get("pictures.2"),
        row.get("pictures.3"),
        row.get("pictures.4"),
        row.get("description"),
        row.get("price+shipping_included"),
        int(row.get("lego_pieces")) if not pd.isna(row.get("lego_pieces")) else None
    ))

conn.commit()
print(f"Inserted {len(df)} rows into lego_products table.")

# === Step 5: Close connection ===
cursor.close()
conn.close()
print("PostgreSQL connection closed successfully.")
