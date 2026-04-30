import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from current directory
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

def fix_schema():
    with engine.connect() as conn:
        print(f"Connecting to {DATABASE_URL}")
        print("Checking if 'follow_up_actions' column exists in 'interactions' table...")
        try:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='interactions' AND column_name='follow_up_actions';"))
            if not result.fetchone():
                print("Column 'follow_up_actions' missing. Adding it...")
                conn.execute(text("ALTER TABLE interactions ADD COLUMN follow_up_actions TEXT;"))
                # conn.commit() is needed for SQLAlchemy 2.x
                try:
                    conn.commit()
                except: pass
                print("Column added successfully.")
            else:
                print("Column 'follow_up_actions' already exists.")
        except Exception as e:
            print(f"Error checking/updating schema: {e}")

if __name__ == "__main__":
    fix_schema()
