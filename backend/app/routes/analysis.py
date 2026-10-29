from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SkinAnalysis
from app.routes.auth_routes import get_current_user
from app.ml import predict_image
from app.config import UPLOADS_DIR

router = APIRouter(prefix="/api/analysis", tags=["Skin Analysis"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(None),
    image: UploadFile = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload = file or image
    if upload is None:
        raise HTTPException(status_code=400, detail="No image file provided")

    if upload.content_type and upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG and WEBP files are allowed")

    content = await upload.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Maximum image size is 10 MB")

    ext = Path(upload.filename or "").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"

    filename = f"{uuid4().hex}{ext}"
    file_path = UPLOADS_DIR / filename
    file_path.write_bytes(content)

    record_id = f"MY-{uuid4().int % 1000000:06d}"
    analysis = SkinAnalysis(
        record_id=record_id,
        user_id=user.id,
        image_path=str(file_path),
        original_filename=upload.filename,
        status="uploaded"
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return {
        "id": analysis.id,
        "analysis_id": analysis.id,
        "record_id": analysis.record_id,
        "image_url": f"/uploads/{filename}",
        "status": analysis.status
    }


@router.post("/predict/{analysis_id}")
def predict(
    analysis_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(SkinAnalysis).filter(
        SkinAnalysis.id == analysis_id,
        SkinAnalysis.user_id == user.id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    try:
        result = predict_image(analysis.image_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    analysis.predicted_class = result["predicted_class"]
    analysis.confidence = result["confidence"]
    analysis.risk_level = result["risk_level"]
    analysis.heatmap_path = result.get("heatmap_path")
    analysis.status = "completed"

    db.commit()

    return {
        "id": analysis.id,
        "analysis_id": analysis.id,
        "record_id": analysis.record_id,
        "result": analysis.predicted_class,
        "predicted_class": analysis.predicted_class,
        "confidence": analysis.confidence,
        "risk_level": analysis.risk_level,
        "heatmap": analysis.heatmap_path,
        "heatmap_url": analysis.heatmap_path,
        "status": analysis.status
    }


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(SkinAnalysis).filter(
        SkinAnalysis.id == analysis_id,
        SkinAnalysis.user_id == user.id
    ).first()

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    return {
        "id": analysis.id,
        "analysis_id": analysis.id,
        "record_id": analysis.record_id,
        "image_path": analysis.image_path,
        "image_url": f"/uploads/{Path(analysis.image_path).name}",
        "predicted_class": analysis.predicted_class,
        "confidence": analysis.confidence,
        "risk_level": analysis.risk_level,
        "heatmap_path": analysis.heatmap_path,
        "heatmap_url": analysis.heatmap_path,
        "status": analysis.status,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None
    }
