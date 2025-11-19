import uvicorn
from fastapi import FastAPI
from App.routes import auth
from App.routes import admin                         # ← ADD THIS
from .database import engine
from . import models

app = FastAPI(title="CorpGPT Backend (Auth + Storage)")

# create tables
models.Base.metadata.create_all(bind=engine)

# routes
app.include_router(auth.router)
app.include_router(admin.router)                     # ← ADD THIS

@app.get("/")
def root():
    return {"status": "ok", "service": "corpgpt-backend"}

if __name__ == "__main__":
    uvicorn.run("App.main:app", host="0.0.0.0", port=8000, reload=True)
