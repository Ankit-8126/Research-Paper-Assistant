
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)

    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)

    status = Column(
        String(50),
        default="In Progress",
        nullable=False
    )

    created_at = Column(
    DateTime(timezone=True),
    default=func.now(),
    server_default=func.now(),
    nullable=True
)
