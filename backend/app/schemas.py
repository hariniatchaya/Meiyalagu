from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Risk Assessment Schemas
class RiskRequest(BaseModel):
    body_location: List[str] = []
    duration: Optional[str] = None
    appearance: List[str] = []
    symptoms: List[str] = []
    size: Optional[str] = None
    change_status: Optional[str] = None
    spread_status: Optional[str] = None
    history: Dict[str, Any] = {}
    notes: Optional[str] = None


# Analysis Schemas
class AnalysisUploadResponse(BaseModel):
    id: int
    analysis_id: int
    record_id: str
    image_url: str
    status: str


class AnalysisPredictResponse(BaseModel):
    id: int
    analysis_id: int
    record_id: str
    result: str
    predicted_class: str
    confidence: float
    risk_level: str
    heatmap: Optional[str] = None
    heatmap_url: Optional[str] = None
    status: str


class AnalysisDetailResponse(BaseModel):
    id: int
    analysis_id: int
    record_id: str
    image_path: str
    image_url: str
    predicted_class: Optional[str] = None
    confidence: Optional[float] = None
    risk_level: Optional[str] = None
    heatmap_path: Optional[str] = None
    heatmap_url: Optional[str] = None
    status: str
    created_at: Optional[str] = None
