import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.database import Base, engine, DB_DIALECT
from app.seed_data import seed_initial_data

if __name__ == "__main__":
    print(f"Creating tables on {DB_DIALECT.upper()}...")
    Base.metadata.create_all(bind=engine)
    print("Seeding initial skin disease data...")
    seed_initial_data()
    print("Database seeding completed successfully.")
