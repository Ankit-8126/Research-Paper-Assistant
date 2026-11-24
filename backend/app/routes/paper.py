
import os
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.paper import Paper
from app.services.dependencies import get_current_user
from fastapi.responses import FileResponse

from app.services.pdf_service import extract_text_from_pdf
from app.services.llm_service import (
    generate_paper_summary,
    generate_key_points,
    generate_paper_answer
)

from app.schemas.chat import ChatRequest

from app.services.chat_service import (
    save_chat_message,
    get_chat_history,
    clear_chat_history
)


router = APIRouter(prefix="/papers", tags=["Papers"])


UPLOAD_DIR = "uploads/papers"

os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_paper(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_paper = Paper(
        user_id=user_id,
        title=file.filename,
        file_name=file.filename,
        file_path=file_path
    )

    db.add(new_paper)
    db.commit()
    db.refresh(new_paper)

    return {
        "message": "Paper uploaded successfully",
        "paper_id": new_paper.id,
        "file_name": new_paper.file_name
    }


@router.get("/")
def get_papers(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = (
        db.query(Paper)
        .filter(Paper.user_id == user_id)
        .all()
    )

    return [
        {
            "id": paper.id,
            "title": paper.title,
            "file_name": paper.file_name,
            "file_path": paper.file_path
        }
        for paper in papers
    ]



@router.get("/{paper_id}/pdf")
def view_paper_pdf(
    paper_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    upload_directory = os.path.abspath(UPLOAD_DIR)
    file_path = os.path.abspath(paper.file_path)

    if os.path.commonpath(
        [upload_directory, file_path]
    ) != upload_directory:
        raise HTTPException(
            status_code=403,
            detail="Invalid file path"
        )

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="PDF file not found on server"
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=os.path.basename(file_path),
        content_disposition_type="inline"
    )



@router.get("/{paper_id}/extract-text")
def extract_paper_text(
    paper_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    extracted_text = extract_text_from_pdf(
        paper.file_path
    )

    if not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text found in PDF"
        )

    paper.extracted_text = extracted_text

    db.commit()
    db.refresh(paper)

    return {
        "paper_id": paper.id,
        "title": paper.title,
        "extracted_text": extracted_text,
        "message": "PDF text extracted and saved successfully"
    }


@router.get("/{paper_id}/text")
def get_saved_paper_text(
    paper_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    if not paper.extracted_text:
        raise HTTPException(
            status_code=404,
            detail="Extracted text not available. Extract the PDF first."
        )

    return {
        "paper_id": paper.id,
        "title": paper.title,
        "extracted_text": paper.extracted_text,
        "message": "Saved extracted text retrieved successfully"
    }


@router.get("/{paper_id}/summary")
def get_paper_summary(
    paper_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    if not paper.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Extract the PDF text first"
        )

    if paper.summary:
        return {
            "paper_id": paper.id,
            "title": paper.title,
            "summary": paper.summary,
            "message": "Saved AI summary retrieved successfully"
        }

    try:
        summary = generate_paper_summary(
            paper.extracted_text
        )

        paper.summary = summary

        db.commit()
        db.refresh(paper)

        return {
            "paper_id": paper.id,
            "title": paper.title,
            "summary": paper.summary,
            "message": "AI summary generated and saved successfully"
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Unable to generate AI summary. Please try again."
        )


@router.get("/{paper_id}/key-points")
def get_paper_key_points(
    paper_id: int,
    regenerate: bool = False,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    if not paper.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Extract the PDF text first"
        )

    if paper.key_points and not regenerate:
        return {
            "paper_id": paper.id,
            "title": paper.title,
            "key_points": paper.key_points,
            "message": "Saved key points retrieved successfully"
        }

    try:
        key_points = generate_key_points(
            paper.extracted_text
        )

        paper.key_points = key_points

        db.commit()
        db.refresh(paper)

        return {
            "paper_id": paper.id,
            "title": paper.title,
            "key_points": paper.key_points,
            "message": "AI key points regenerated and saved successfully"
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Unable to generate AI key points. Please try again."
        )


@router.post("/{paper_id}/chat")
def chat_with_paper(
    paper_id: int,
    chat_request: ChatRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    if not paper.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Extract the PDF text first"
        )

    try:
        chat_history = get_chat_history(
            db,
            paper_id,
            user_id
        )

        answer = generate_paper_answer(
            paper.extracted_text,
            chat_request.question,
            chat_history
        )

        save_chat_message(
            db,
            paper_id,
            user_id,
            "user",
            chat_request.question
        )

        save_chat_message(
            db,
            paper_id,
            user_id,
            "assistant",
            answer
        )

        db.commit()

        return {
            "paper_id": paper.id,
            "question": chat_request.question,
            "answer": answer,
            "message": "AI answer generated and chat history saved successfully"
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail="Unable to generate AI answer. Please try again."
        )


@router.get("/{paper_id}/chat-history")
def get_paper_chat_history(
    paper_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    chat_history = get_chat_history(
        db,
        paper_id,
        user_id
    )

    return {
        "paper_id": paper.id,
        "chat_history": chat_history,
        "message": "Chat history retrieved successfully"
    }


@router.delete("/{paper_id}/chat-history")
def delete_paper_chat_history(
    paper_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(
        Paper.id == paper_id,
        Paper.user_id == user_id
    ).first()

    if not paper:
        raise HTTPException(
            status_code=404,
            detail="Paper not found"
        )

    clear_chat_history(
        db,
        paper_id,
        user_id
    )

    return {
        "paper_id": paper.id,
        "message": "Chat history cleared successfully"
    }
