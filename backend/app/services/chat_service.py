
from sqlalchemy.orm import Session
from app.models.chat import ChatMessage


def save_chat_message(
    db: Session,
    paper_id: int,
    user_id: int,
    role: str,
    message: str
):
    chat_message = ChatMessage(
        paper_id=paper_id,
        user_id=user_id,
        role=role,
        message=message
    )

    db.add(chat_message)
    db.flush()
    db.refresh(chat_message)

    return chat_message


def get_chat_history(
    db: Session,
    paper_id: int,
    user_id: int
):
    messages = db.query(ChatMessage).filter(
        ChatMessage.paper_id == paper_id,
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.id.asc()).all()

    return [
        {
            "role": chat.role,
            "content": chat.message
        }
        for chat in messages
    ]



def clear_chat_history(
    db: Session,
    paper_id: int,
    user_id: int
):
    db.query(ChatMessage).filter(
        ChatMessage.paper_id == paper_id,
        ChatMessage.user_id == user_id
    ).delete(synchronize_session=False)

    db.commit()

    return True
