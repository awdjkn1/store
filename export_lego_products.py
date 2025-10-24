import pandas as pd
import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "port": "5432",
    "database": "lego_store",
    "user": "postgres",
    "password": "Lego@store1234"
}

# Connect to PostgreSQL and fetch data
def fetch_and_save_json():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        query = "SELECT * FROM lego_products;"
        df = pd.read_sql_query(query, conn)
        df.to_json("lego_products_export.json", orient="records", indent=2)
        print("Data exported to lego_products_export.json")
    except Exception as e:
        print("Error:", e)
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    fetch_and_save_json()
