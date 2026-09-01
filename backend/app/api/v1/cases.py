from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from datetime import datetime, timezone, timedelta
import os
import uuid
import aiofiles

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.core.rate_limit import limiter
from app.models.entities import (
    User, Case, Evidence, Document, Report, Notification, ActivityLog,
    UserRole, CaseStatus, CasePriority,
)
from app.schemas import (
    CaseCreate, CaseUpdate, CaseResponse, AnalyzeCaseRequest,
    ChatRequest, ChatResponse, DashboardStats, EvidenceCreate, NotificationResponse,
)
from app.ai.pipeline import analyze_case
from app.ai.ocr_processor import extract_text_from_file
from app.ai.chat_investigator import chat_investigator
from app.services.report_generator import generate_report_pdf

router = APIRouter(prefix="/cases", tags=["Cases"])


@router.get("/", response_model=list[CaseResponse])
async def list_cases(
    status: CaseStatus | None = None,
    priority: CasePriority | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Case)
    if current_user.role == UserRole.INVESTIGATOR:
        query = query.where(Case.assigned_officer_id == current_user.id)
    if status:
        query = query.where(Case.status == status)
    if priority:
        query = query.where(Case.priority == priority)
    query = query.order_by(Case.updated_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=CaseResponse, status_code=201)
async def create_case(
    data: CaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.ADMINISTRATOR)),
):
    existing = await db.execute(select(Case).where(Case.case_id == data.case_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Case ID already exists")
    case = Case(**data.model_dump(), assigned_officer_id=current_user.id, status=CaseStatus.DRAFT)
    db.add(case)
    await db.flush()
    db.add(ActivityLog(case_id=case.id, user_id=current_user.id, action="case_created", details=f"Case {data.case_id} created"))
    return case


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = await _get_case_or_404(case_id, db)
    _check_case_access(case, current_user)
    return case


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int, data: CaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.ADMINISTRATOR)),
):
    case = await _get_case_or_404(case_id, db)
    _check_case_access(case, current_user)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(case, key, value)
    db.add(ActivityLog(case_id=case.id, user_id=current_user.id, action="case_updated"))
    return case


@router.delete("/{case_id}")
async def delete_case(
    case_id: int, db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
):
    case = await _get_case_or_404(case_id, db)
    await db.delete(case)
    return {"message": "Case deleted"}


@router.post("/{case_id}/analyze")
@limiter.limit("30/minute")
async def analyze_case_endpoint(
    request: Request, case_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.ADMINISTRATOR)),
):
    case = await _get_case_or_404(case_id, db)
    case_dict = {c.name: getattr(case, c.name) for c in case.__table__.columns}
    analysis = await analyze_case(case_dict)

    case.extracted_entities = analysis["extracted_entities"]
    case.crime_category = analysis["crime_category"]
    case.crime_category_confidence = analysis["crime_category_confidence"]
    case.ai_analysis = {"evidence": analysis["evidence_analysis"], "similar_cases": analysis["similar_cases"]}
    case.timeline = analysis["timeline"]
    case.suspect_rankings = analysis["suspect_rankings"]
    case.recommendations = analysis["recommendations"]
    case.predictions = analysis["predictions"]
    case.relationship_graph = analysis["relationship_graph"]
    case.solvability_score = analysis["solvability_score"]
    case.investigation_complexity = analysis["investigation_complexity"]
    case.status = CaseStatus.UNDER_INVESTIGATION

    db.add(ActivityLog(case_id=case.id, user_id=current_user.id, action="case_analyzed"))
    db.add(Notification(
        user_id=current_user.id, title="Analysis Complete",
        message=f"AI analysis completed for case {case.case_id}",
        notification_type="prediction_updated", case_id=case.id,
    ))
    return {"case": case, "analysis": analysis}


@router.post("/{case_id}/upload")
async def upload_document(
    case_id: int, file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.ADMINISTRATOR)),
):
    case = await _get_case_or_404(case_id, db)
    upload_dir = os.path.join(settings.upload_dir, str(case_id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "bin"
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, safe_name)

    content = await file.read()
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    extracted_text, ocr_conf = extract_text_from_file(file_path, ext)
    doc = Document(
        case_id=case.id, filename=file.filename or safe_name,
        file_path=file_path, file_type=ext, file_size=len(content),
        extracted_text=extracted_text, ocr_confidence=ocr_conf,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    if extracted_text and not case.crime_description:
        case.crime_description = extracted_text[:5000]

    db.add(ActivityLog(case_id=case.id, user_id=current_user.id, action="document_uploaded", details=file.filename))
    db.add(Notification(user_id=current_user.id, title="Evidence Uploaded", message=f"Document {file.filename} uploaded", notification_type="evidence_uploaded", case_id=case.id))
    await db.flush()
    return {"document_id": doc.id, "extracted_text_preview": extracted_text[:500], "ocr_confidence": ocr_conf}


@router.post("/{case_id}/chat", response_model=ChatResponse)
async def chat_with_case(
    case_id: int, data: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = await _get_case_or_404(case_id, db)
    case_dict = {c.name: getattr(case, c.name) for c in case.__table__.columns}
    result = await chat_investigator.chat(case_id, data.message, case_dict)

    from app.models.entities import ChatMessage
    db.add(ChatMessage(case_id=case.id, user_id=current_user.id, role="user", content=data.message))
    db.add(ChatMessage(case_id=case.id, user_id=current_user.id, role="assistant", content=result["response"], sources=result.get("sources")))

    return ChatResponse(response=result["response"], sources=result.get("sources"), disclaimer=result["disclaimer"])


@router.post("/{case_id}/report")
async def generate_report(
    case_id: int, db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.ADMINISTRATOR)),
):
    case = await _get_case_or_404(case_id, db)
    case_dict = {c.name: getattr(case, c.name) for c in case.__table__.columns}
    analysis = {
        "extracted_entities": case.extracted_entities,
        "suspect_rankings": case.suspect_rankings,
        "timeline": case.timeline,
        "predictions": case.predictions,
        "recommendations": case.recommendations,
        "evidence_analysis": (case.ai_analysis or {}).get("evidence", {}),
    }
    pdf_path = generate_report_pdf(case_dict, analysis, current_user.full_name)
    report = Report(case_id=case.id, title=f"Investigation Report - {case.case_id}", content=analysis, pdf_path=pdf_path, created_by=current_user.id)
    db.add(report)
    db.add(Notification(user_id=current_user.id, title="Report Generated", message=f"Report for {case.case_id} ready", notification_type="report_generated", case_id=case.id))
    return {"report_id": report.id, "pdf_path": pdf_path}


@router.post("/{case_id}/evidence")
async def add_evidence(
    case_id: int, data: EvidenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INVESTIGATOR, UserRole.ADMINISTRATOR)),
):
    case = await _get_case_or_404(case_id, db)
    ev = Evidence(case_id=case.id, **data.model_dump())
    db.add(ev)
    return ev


async def _get_case_or_404(case_id: int, db: AsyncSession) -> Case:
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _check_case_access(case: Case, user: User):
    if user.role == UserRole.ADMINISTRATOR or user.role == UserRole.SUPERVISOR:
        return
    if user.role == UserRole.INVESTIGATOR and case.assigned_officer_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
