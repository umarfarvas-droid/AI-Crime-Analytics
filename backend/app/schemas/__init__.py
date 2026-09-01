from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.entities import UserRole, CaseStatus, CasePriority


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    badge_number: Optional[str] = None
    department: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    badge_number: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    badge_number: Optional[str] = None
    department: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# Case Schemas
class CaseCreate(BaseModel):
    case_id: str
    fir_number: str
    police_station: str
    crime_category: Optional[str] = None
    incident_date: Optional[datetime] = None
    incident_time: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crime_description: Optional[str] = None
    victim_details: Optional[dict] = None
    suspect_details: Optional[dict] = None
    witness_details: Optional[dict] = None
    evidence_list: Optional[dict] = None
    additional_notes: Optional[str] = None
    priority: CasePriority = CasePriority.MEDIUM


class CaseUpdate(BaseModel):
    fir_number: Optional[str] = None
    police_station: Optional[str] = None
    crime_category: Optional[str] = None
    incident_date: Optional[datetime] = None
    incident_time: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crime_description: Optional[str] = None
    victim_details: Optional[dict] = None
    suspect_details: Optional[dict] = None
    witness_details: Optional[dict] = None
    evidence_list: Optional[dict] = None
    additional_notes: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None


class CaseResponse(BaseModel):
    id: int
    case_id: str
    fir_number: str
    police_station: str
    crime_category: Optional[str] = None
    crime_category_confidence: Optional[float] = None
    incident_date: Optional[datetime] = None
    incident_time: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crime_description: Optional[str] = None
    victim_details: Optional[dict] = None
    suspect_details: Optional[dict] = None
    witness_details: Optional[dict] = None
    evidence_list: Optional[dict] = None
    additional_notes: Optional[str] = None
    status: CaseStatus
    priority: CasePriority
    solvability_score: Optional[float] = None
    investigation_complexity: Optional[str] = None
    extracted_entities: Optional[dict] = None
    ai_analysis: Optional[dict] = None
    timeline: Optional[dict] = None
    suspect_rankings: Optional[dict] = None
    recommendations: Optional[dict] = None
    predictions: Optional[dict] = None
    relationship_graph: Optional[dict] = None
    assigned_officer_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalyzeCaseRequest(BaseModel):
    case_id: int


class ChatRequest(BaseModel):
    case_id: int
    message: str


class ChatResponse(BaseModel):
    response: str
    sources: Optional[list] = None
    disclaimer: str


class DashboardStats(BaseModel):
    total_cases: int
    open_cases: int
    closed_cases: int
    high_priority_cases: int
    pending_evidence: int
    todays_investigations: int
    crime_categories: dict
    ai_prediction_accuracy: float
    avg_solvability_score: float


class SearchRequest(BaseModel):
    query: str
    filters: Optional[dict] = None


class EvidenceCreate(BaseModel):
    name: str
    evidence_type: str
    description: Optional[str] = None
    is_collected: bool = False


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    case_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
