from fastapi import APIRouter

from app.api.v1 import auth, cases, dashboard, simulator

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(cases.router)
api_router.include_router(dashboard.router)
api_router.include_router(simulator.router)
