from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Disease

router = APIRouter(prefix="/api/diseases", tags=["Disease Library"])


@router.get("")
def get_diseases(db: Session = Depends(get_db)):
    return db.query(Disease).order_by(Disease.name).all()


@router.get("/search")
def search_diseases(q: str, db: Session = Depends(get_db)):
    return db.query(Disease).filter(Disease.name.ilike(f"%{q}%")).all()


@router.get("/{disease_id}")
def get_disease(disease_id: int, db: Session = Depends(get_db)):
    disease = db.get(Disease, disease_id)
    if not disease:
        raise HTTPException(status_code=404, detail="Disease not found")
    return disease
