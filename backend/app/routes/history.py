import csv
import io
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SkinAnalysis
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("")
def get_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(SkinAnalysis).filter(
        SkinAnalysis.user_id == user.id
    ).order_by(SkinAnalysis.created_at.desc()).all()

    return [
        {
            "id": x.id,
            "analysis_id": x.id,
            "record_id": x.record_id,
            "original_filename": x.original_filename,
            "image_url": f"/uploads/{Path(x.image_path).name}",
            "predicted_class": x.predicted_class,
            "confidence": x.confidence,
            "risk_level": x.risk_level,
            "heatmap_url": x.heatmap_path,
            "status": x.status,
            "created_at": x.created_at.isoformat() if x.created_at else None
        }
        for x in records
    ]


@router.delete("/{analysis_id}")
def delete_record(
    analysis_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(SkinAnalysis).filter(
        SkinAnalysis.id == analysis_id,
        SkinAnalysis.user_id == user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully", "id": analysis_id}


@router.get("/export")
def export_csv(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(SkinAnalysis).filter(
        SkinAnalysis.user_id == user.id
    ).order_by(SkinAnalysis.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID",
        "Filename",
        "Predicted Condition",
        "Confidence",
        "Risk Level",
        "Status",
        "Date"
    ])

    for x in records:
        writer.writerow([
            x.record_id,
            x.original_filename or "",
            x.predicted_class or "",
            f"{x.confidence:.2%}" if x.confidence else "",
            x.risk_level or "",
            x.status or "",
            x.created_at.isoformat() if x.created_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=meiyalagu_history.csv"}
    )
