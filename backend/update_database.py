
from sqlalchemy import inspect, text
from app.database.database import engine

inspector = inspect(engine)

columns = [
    column["name"]
    for column in inspector.get_columns("papers")
]

with engine.begin() as connection:

    if "extracted_text" not in columns:
        connection.execute(
            text("ALTER TABLE papers ADD COLUMN extracted_text TEXT")
        )
        print("extracted_text column added successfully")

    if "summary" not in columns:
        connection.execute(
            text("ALTER TABLE papers ADD COLUMN summary TEXT")
        )
        print("summary column added successfully")

    if "key_points" not in columns:
        connection.execute(
            text("ALTER TABLE papers ADD COLUMN key_points TEXT")
        )
        print("key_points column added successfully")

print("Database migration completed")
