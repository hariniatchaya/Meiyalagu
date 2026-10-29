from uuid import uuid4
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, RiskAssessment
from app.schemas import RiskRequest
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/api/risk", tags=["Risk Screening"])


def calculate_risk_score(data: RiskRequest):
    """Compute informative screening score based on reported signs and symptoms."""
    score = 0
    appearance_points = {
        "Color changes": 1,
        "Redness": 1,
        "Dark/black spot": 2,
        "Raised/bumpy area": 1,
        "Scaly/dry skin": 1,
        "Rash": 1,
        "Blister": 1,
        "Wound/ulcer": 2,
        "Mole/spot changing": 3
    }
    symptom_points = {
        "Itching": 1,
        "Pain": 1,
        "Burning": 1,
        "Tenderness": 1,
        "Bleeding": 3,
        "Swelling": 1,
        "Discharge": 2
    }

    for item in data.appearance:
        score += appearance_points.get(item, 0)
    for item in data.symptoms:
        score += symptom_points.get(item, 0)

    if data.change_status == "Getting worse":
        score += 2
    if data.spread_status in ["Spread", "Recently appeared"]:
        score += 1

    if score >= 7:
        category = "High"
    elif score >= 4:
        category = "Moderate"
    else:
        category = "Low"

    return score, category


@router.post("/assess")
def assess(
    data: RiskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    score, category = calculate_risk_score(data)
    record_id = f"RS-{uuid4().int % 1000000:06d}"

    assessment = RiskAssessment(
        record_id=record_id,
        user_id=user.id,
        body_location=data.body_location,
        duration=data.duration,
        appearance=data.appearance,
        symptoms=data.symptoms,
        size=data.size,
        change_status=data.change_status,
        spread_status=data.spread_status,
        history=data.history,
        notes=data.notes,
        risk_score=score,
        risk_category=category
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return {
        "id": assessment.id,
        "record_id": assessment.record_id,
        "risk_score": assessment.risk_score,
        "risk_category": assessment.risk_category,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None
    }
