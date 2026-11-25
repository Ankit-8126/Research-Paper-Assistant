
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database.database import engine, Base
from app.models.user import User
from app.models.paper import Paper
from app.models.chat import ChatMessage

from app.routes.user import router as user_router
from app.routes.paper import router as paper_router
from app.routes.published import router as published_router


app = FastAPI(
    title="Research Paper Assistant",
    description="AI-powered Research Paper Assistant API",
    version="1.0.0"
)


frontend_url = os.getenv("FRONTEND_URL")

allowed_origins = ["http://localhost:5173"]

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)


def migrate_paper_table():

    inspector = inspect(engine)

    if "papers" not in inspector.get_table_names():
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("papers")
    }

    with engine.begin() as connection:

        if "status" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE papers "
                    "ADD COLUMN status VARCHAR(50) "
                    "NOT NULL DEFAULT 'In Progress'"
                )
            )

        if "created_at" not in columns:

            if engine.dialect.name == "sqlite":
                connection.execute(
                    text(
                        "ALTER TABLE papers "
                        "ADD COLUMN created_at DATETIME"
                    )
                )

            else:
                connection.execute(
                    text(
                        "ALTER TABLE papers "
                        "ADD COLUMN created_at "
                        "TIMESTAMP WITH TIME ZONE "
                        "DEFAULT CURRENT_TIMESTAMP"
                    )
                )

        # Fix existing papers with NULL created_at values
        connection.execute(
            text(
                "UPDATE papers "
                "SET created_at = CURRENT_TIMESTAMP "
                "WHERE created_at IS NULL"
            )
        )


migrate_paper_table()


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
