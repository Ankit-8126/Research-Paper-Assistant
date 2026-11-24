
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)

    paper_id = Column(
        Integer,
        ForeignKey("papers.id"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    role = Column(String(20), nullable=False)

    message = Column(Text, nullable=False)
