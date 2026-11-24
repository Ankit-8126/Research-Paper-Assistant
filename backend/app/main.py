from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine, Base
from app.models.user import User
from app.models.paper import Paper
from app.routes.user import router as user_router
from app.routes.paper import router as paper_router
from app.routes.published import router as published_router

from app.models.chat import ChatMessage

app = FastAPI(
    title="Research Paper Assistant",
    description="AI-powered Research Paper Assistant API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)

app.include_router(user_router)
app.include_router(paper_router)
app.include_router(published_router)

@app.get("/")
def home():
    return {
        "message": "Research Paper Assistant API is running"
    }


@app.get("/database-test")
def database_test():
    return {
        "message": "Database connection is working"
    }