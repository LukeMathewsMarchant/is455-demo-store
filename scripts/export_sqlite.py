import json
import sqlite3
from pathlib import Path

DB_PATH = Path("shop.db")
OUT_DIR = Path("shop_export")
OUT_DIR.mkdir(exist_ok=True)

TABLES = ["customers", "products", "orders", "order_items", "shipments", "product_reviews"]

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

for table in TABLES:
    rows = conn.execute(f"SELECT * FROM {table}").fetchall()
    serialized = [dict(row) for row in rows]
    (OUT_DIR / f"{table}.json").write_text(json.dumps(serialized, indent=2, default=str))
    print(f"Exported {table}: {len(serialized)} rows")

conn.close()
