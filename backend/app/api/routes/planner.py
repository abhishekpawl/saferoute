from fastapi import APIRouter

from app.schemas.planner import PlannerChatRequest, PlannerChatResponse
from app.services.planner_service import generate_planner_reply


router = APIRouter()


@router.post("/chat", response_model=PlannerChatResponse)
async def planner_chat(payload: PlannerChatRequest) -> PlannerChatResponse:
    return await generate_planner_reply(payload)

