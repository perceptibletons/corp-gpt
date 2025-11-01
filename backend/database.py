from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from .config import settings
import os

DATABASE_URL = settings.DATABASE_URL
os.makedirs(os.path.dirname(DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def init_db():
    # placeholder for migrations, seed data, etc.
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
