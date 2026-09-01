from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.entities import User, Case, Evidence, Notification, ActivityLog, AuditLog, AISettings, UserRole, CaseStatus, CasePriority
from app.schemas import DashboardStats, UserResponse, UserUpdate, NotificationResponse, SearchRequest

router = APIRouter(tags=["Dashboard & Admin"])


@router.get("/dashboard/stats", response_model=DashboardStats)
async def dashboard_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total = await db.scalar(select(func.count(Case.id)))
    open_cases = await db.scalar(select(func.count(Case.id)).where(Case.status.in_([CaseStatus.OPEN, CaseStatus.UNDER_INVESTIGATION, CaseStatus.DRAFT])))
    closed = await db.scalar(select(func.count(Case.id)).where(Case.status == CaseStatus.CLOSED))
    high_priority = await db.scalar(select(func.count(Case.id)).where(Case.priority.in_([CasePriority.HIGH, CasePriority.CRITICAL])))
    pending_evidence = await db.scalar(select(func.count(Evidence.id)).where(Evidence.is_collected == False))
    today_inv = await db.scalar(select(func.count(ActivityLog.id)).where(ActivityLog.created_at >= today))

    cat_result = await db.execute(select(Case.crime_category, func.count(Case.id)).group_by(Case.crime_category))
    categories = {row[0] or "Unknown": row[1] for row in cat_result.all()}

    avg_solv = await db.scalar(select(func.avg(Case.solvability_score)).where(Case.solvability_score.isnot(None)))

    return DashboardStats(
        total_cases=total or 0,
        open_cases=open_cases or 0,
        closed_cases=closed or 0,
        high_priority_cases=high_priority or 0,
        pending_evidence=pending_evidence or 0,
        todays_investigations=today_inv or 0,
        crime_categories=categories,
        ai_prediction_accuracy=0.78,
        avg_solvability_score=round(avg_solv or 55.0, 1),
    )


@router.get("/dashboard/activities")
async def recent_activities(limit: int = 20, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit))
    logs = result.scalars().all()
    return [{"id": l.id, "action": l.action, "details": l.details, "case_id": l.case_id, "created_at": l.created_at.isoformat()} for l in logs]


@router.get("/dashboard/analytics")
async def analytics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    cat_result = await db.execute(select(Case.crime_category, func.count(Case.id)).group_by(Case.crime_category))
    resolution = await db.scalar(select(func.count(Case.id)).where(Case.status == CaseStatus.CLOSED))
    total = await db.scalar(select(func.count(Case.id)))

    return {
        "monthly_trends": [{"month": "Jan", "cases": 12}, {"month": "Feb", "cases": 18}, {"month": "Mar", "cases": 15}],
        "crime_categories": {row[0] or "Other": row[1] for row in cat_result.all()},
        "resolution_rate": round((resolution or 0) / max(total or 1, 1) * 100, 1),
        "avg_investigation_days": 42,
        "evidence_collection_rate": 68.5,
        "ai_accuracy": 78.2,
        "hotspots": [
            {"location": "Downtown Business District", "count": 24, "lat": 28.6139, "lng": 77.2090},
            {"location": "Industrial Zone", "count": 15, "lat": 28.5355, "lng": 77.3910},
            {"location": "Residential Area B", "count": 11, "lat": 28.4595, "lng": 77.0266},
        ],
    }


@router.post("/search")
async def global_search(data: SearchRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = f"%{data.query}%"
    result = await db.execute(
        select(Case).where(or_(
            Case.case_id.ilike(q), Case.fir_number.ilike(q),
            Case.location.ilike(q), Case.crime_category.ilike(q),
            Case.crime_description.ilike(q),
        )).limit(20)
    )
    cases = result.scalars().all()
    return [{"id": c.id, "case_id": c.case_id, "fir_number": c.fir_number, "crime_category": c.crime_category, "status": c.status.value, "location": c.location} for c in cases]


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50))
    return result.scalars().all()


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
    return {"message": "Marked as read"}


# Admin routes
admin_router = APIRouter(prefix="/admin", tags=["Administration"])


@admin_router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMINISTRATOR))):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@admin_router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, data: UserUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_roles(UserRole.ADMINISTRATOR))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.add(AuditLog(user_id=admin.id, action="user_updated", resource=f"user:{user_id}"))
    return user


@admin_router.get("/ai-settings")
async def get_ai_settings(db: AsyncSession = Depends(get_db), _: User = Depends(require_roles(UserRole.ADMINISTRATOR))):
    result = await db.execute(select(AISettings))
    return result.scalars().all()


@admin_router.put("/ai-settings/{key}")
async def update_ai_setting(key: str, value: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_roles(UserRole.ADMINISTRATOR))):
    result = await db.execute(select(AISettings).where(AISettings.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    setting.value = value
    db.add(AuditLog(user_id=admin.id, action="ai_setting_updated", resource=key))
    return setting

router.include_router(admin_router)
