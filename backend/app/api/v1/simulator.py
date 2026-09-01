from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.pipeline import analyze_case

router = APIRouter(prefix="/simulator", tags=["Simulator"])


class SimulationRequest(BaseModel):
    description: str = Field(..., min_length=20, description="Full natural-language crime case description")


@router.post("/analyze")
async def analyze_simulation(request: SimulationRequest):
    if not request.description.strip():
        raise HTTPException(status_code=400, detail="Case description cannot be empty")

    analysis = await analyze_case({"crime_description": request.description})
    return {"simulation": analysis}
