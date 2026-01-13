import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware   # ← ADD THIS
from App.routes import auth
from App.routes import admin
from .database import engine
from . import models

app = FastAPI(title="CorpGPT Backend (Auth + Storage)")

# ------------------ CORS MIDDLEWARE ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# -----------------------------------------------------

# create tables
models.Base.metadata.create_all(bind=engine)

# routes
app.include_router(auth.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {"status": "ok", "service": "corpgpt-backend"}

if __name__ == "__main__":
    uvicorn.run("App.main:app", host="0.0.0.0", port=8000, reload=True)
