from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, UserResponse, TokenResponse, UserUpdateRequest
from app.auth import hash_password, verify_password, create_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


def get_or_create_demo_user(db: Session) -> User:
    """Ensure a default user account exists for seamless local workflow."""
    demo = db.query(User).filter(User.email == "demo@meiyalagu.ai").first()
    if not demo:
        demo = User(
            name="Harini",
            email="demo@meiyalagu.ai",
            password_hash=hash_password("password123")
        )
        db.add(demo)
        db.commit()
        db.refresh(demo)
    return demo


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Resolve current user from JWT token, or default demo user if unauthenticated."""
    if credentials and credentials.credentials:
        try:
            user_id = decode_token(credentials.credentials)
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user
        except Exception:
            pass
    return get_or_create_demo_user(db)


@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }


@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name:
        current_user.name = data.name.strip()
    if data.email:
        new_email = data.email.lower().strip()
        existing = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already used by another account")
        current_user.email = new_email
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }
