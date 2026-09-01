from sqlalchemy import select

from app.core.database import async_session
from app.core.security import hash_password
from app.models.entities import User, UserRole, AISettings


DEFAULT_USERS = [
    {
        "email": "admin@crimeanalytics.gov",
        "password": "Admin@123",
        "full_name": "System Administrator",
        "role": UserRole.ADMINISTRATOR,
        "badge_number": "ADM-001",
        "department": "IT Administration",
    },
    {
        "email": "investigator@crimeanalytics.gov",
        "password": "Invest@123",
        "full_name": "Det. Sarah Mitchell",
        "role": UserRole.INVESTIGATOR,
        "badge_number": "INV-042",
        "department": "Homicide Division",
    },
    {
        "email": "supervisor@crimeanalytics.gov",
        "password": "Super@123",
        "full_name": "Capt. James Rodriguez",
        "role": UserRole.SUPERVISOR,
        "badge_number": "SUP-007",
        "department": "Criminal Investigation",
    },
]

DEFAULT_AI_SETTINGS = [
    ("model_name", "gpt-4o-mini", "OpenAI model for analysis"),
    ("confidence_threshold", "0.6", "Minimum confidence for AI outputs"),
    ("max_tokens", "4096", "Max tokens for AI responses"),
    ("enable_rag", "true", "Enable RAG for chat investigator"),
    ("disclaimer_enabled", "true", "Show ethical AI disclaimers"),
]


async def seed_default_users():
    async with async_session() as session:
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            return

        for u in DEFAULT_USERS:
            user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                badge_number=u["badge_number"],
                department=u["department"],
            )
            session.add(user)

        for key, value, desc in DEFAULT_AI_SETTINGS:
            session.add(AISettings(key=key, value=value, description=desc))

        await session.commit()
