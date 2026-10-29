from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db, DB_DIALECT
from app.models import User, SkinAnalysis, RiskAssessment
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analyses = db.query(SkinAnalysis).filter(SkinAnalysis.user_id == user.id).all()
    assessments = db.query(RiskAssessment).filter(RiskAssessment.user_id == user.id).all()

    recent = sorted(analyses, key=lambda x: x.created_at, reverse=True)[:5]

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        },
        "database": {
            "dialect": DB_DIALECT,
            "status": "connected"
        },
        "saved_analyses": len(analyses),
        "screening_assessments": len(assessments),
        "total_records": len(analyses) + len(assessments),
        "ai_connection": "Model connected",
        "recent_activity": [
            {
                "id": x.id,
                "record_id": x.record_id,
                "result": x.predicted_class,
                "confidence": x.confidence,
                "risk_level": x.risk_level,
                "status": x.status,
                "created_at": x.created_at.isoformat() if x.created_at else None
            }
            for x in recent
        ]
    }
