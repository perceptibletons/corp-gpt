from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .config import settings
from .database import init_db, engine
from .routes import auth, upload, ai, user
from .models import Base

def create_app():
    app = FastAPI(title="Enterprise AI Assistant")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Create DB tables
    Base.metadata.create_all(bind=engine)
    init_db()

    # Register routes
    app.include_router(auth.router, prefix="/auth")
    app.include_router(upload.router, prefix="/upload")
    app.include_router(ai.router, prefix="/ai")
    app.include_router(user.router, prefix="/user")

    return app

app = create_app()
