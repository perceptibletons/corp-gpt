import uvicorn
from fastapi import FastAPI
from App.routes import auth 
from .database import engine
from . import models
from .config import JWT_SECRET

app = FastAPI(title="CorpGPT Backend (Auth + Storage)")

# create tables if not exist (simple dev migration)
models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "corpgpt-backend"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
