import logging
from datetime import UTC, datetime

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.schemas.planner import PlannerChatRequest, PlannerChatResponse

logger = logging.getLogger(__name__)


def _safe_mode_instructions(destination_context: str | None) -> str:
    destination_line = f"Destination or context: {destination_context}." if destination_context else "Destination may be inferred from the user's question."
    return (
        "You are SafeRoute's trip safety planner. "
        "Help travelers plan practical, safety-aware trips. "
        "Only answer requests that are about travel, trips, destinations, stays, transport, itineraries, budgets, packing, or follow-up questions tied to an ongoing travel-planning conversation. "
        "If the latest user request is unrelated to travel or trip planning and is not a valid follow-up to the current trip conversation, politely say you can help with trip planning and ask the user to share a destination, duration, budget, travel style, or safety concern. "
        "If the latest user request is a follow-up question about an existing trip plan, answer it using the conversation context instead of asking the user to restate everything. "
        "Prioritize personal safety, local transport safety, arrival timing, scams to watch for, neighborhood awareness, emergency preparedness, and respectful local norms. "
        "Be calm and useful, not alarmist. "
        "When the user asks about a place or gives only a destination, produce a structured answer with clear sections. "
        "Do not give a short 2-3 line reply when the user is asking for a destination plan. "
        "Default to a rich, detailed answer with multiple sections and practical depth. "
        "Prefer this shape when relevant: a confident opening overview, best areas to stay, stay recommendations or hotel categories from budget to premium, a practical 3-day itinerary, non-negotiable safety rules, a reality check, and pro tips. "
        "Within each section, include concrete recommendations, reasons, and short sub-bullets rather than vague summaries. "
        "If the user asks about women traveling solo, explicitly optimize the answer for a solo female traveler and include location choice, arrival strategy, hotel selection logic, daily movement strategy, and night safety. "
        "If the traveler profile suggests a woman traveling solo, include women-focused practical precautions without sounding patronizing. "
        "If exact hotel names or highly current details are uncertain, say that users should verify recent reviews and transport options before booking. "
        "If a condition may change frequently, say so clearly and recommend checking official local sources. "
        "Use markdown headings and flat bullets where they improve readability. "
        "Aim for at least 6 substantial sections for destination-planning prompts. "
        f"{destination_line}"
    )


def _general_mode_instructions(destination_context: str | None) -> str:
    destination_line = f"Destination or context: {destination_context}." if destination_context else "Destination may be inferred from the user's question."
    return (
        "You are SafeRoute's general trip planner. "
        "Help travelers with itineraries, transport suggestions, budgeting, timing, packing, food ideas, and trip organization. "
        "Only answer requests that are about travel, trips, destinations, stays, transport, itineraries, budgets, packing, or follow-up questions tied to an ongoing travel-planning conversation. "
        "If the latest user request is unrelated to travel or trip planning and is not a valid follow-up to the current trip conversation, politely say you can help with trip planning and ask the user to share a destination, duration, budget, or travel style. "
        "If the latest user request is a follow-up question about an existing trip plan, answer it using the conversation context instead of asking the user to restate everything. "
        "Keep the tone friendly, practical, and detailed. "
        "When the user provides only a place or wants a trip plan, produce a structured answer with a quick overview, best areas to stay, trip style recommendations, a practical 3-day itinerary, transport tips, food or local experience ideas, and budget guidance. "
        "Do not respond with only a few lines when the user is clearly asking for a full destination plan. "
        "Use rich structure and enough detail that the answer feels immediately useful without being bloated. "
        "If you mention hotels or neighborhoods, prefer useful categories and well-known areas over fabricated specifics. "
        "Use markdown headings and flat bullets where they improve readability. "
        "Do not over-focus on risk unless the user asks for safety advice. "
        f"{destination_line}"
    )


def _instructions_for_mode(mode: str, destination_context: str | None) -> str:
    if mode == "SAFE":
        return _safe_mode_instructions(destination_context)
    return _general_mode_instructions(destination_context)


def _conversation_as_text(payload: PlannerChatRequest) -> str:
    lines: list[str] = []
    if payload.destination_context:
        lines.append(f"Trip brief / destination context: {payload.destination_context}")

    lines.append("Conversation:")
    for message in payload.messages:
        speaker = "User" if message.role == "user" else "Planner"
        lines.append(f"{speaker}: {message.content}")

    lines.append(
        "Respond to the latest user request while preserving context from the conversation above. "
        "If the latest user message is off-topic and not a travel-related follow-up, redirect the user back to trip planning."
    )
    return "\n".join(lines)


def _fallback_reply(mode: str, destination_context: str | None, user_message: str) -> str:
    place = destination_context or "your destination"
    if mode == "SAFE":
        return (
            f"I can't reach the live planner right now, but here is a safety-first starting point for {place}: "
            "arrive in daylight if possible, pre-book the first ride or stay, keep offline maps and emergency numbers ready, "
            "share your itinerary with someone you trust, and avoid isolated areas until you understand the local layout. "
            f"Question received: {user_message}"
        )
    return (
        f"I can't reach the live planner right now, but here is a general trip-planning starting point for {place}: "
        "lock your travel dates, estimate a daily budget, shortlist neighborhoods to stay in, pre-check local transport options, "
        "and build a loose day-by-day plan with one or two key activities per day. "
        f"Question received: {user_message}"
    )


def _get_field(item, field: str):
    if isinstance(item, dict):
        return item.get(field)
    return getattr(item, field, None)


def _extract_response_text(response) -> str:
    direct_text = _get_field(response, "output_text")
    if isinstance(direct_text, str) and direct_text.strip():
        return direct_text.strip()

    text_parts: list[str] = []
    for output_item in _get_field(response, "output") or []:
        if _get_field(output_item, "type") != "message":
            continue

        for content_item in _get_field(output_item, "content") or []:
            content_type = _get_field(content_item, "type")
            if content_type in {"output_text", "text"}:
                text_value = _get_field(content_item, "text")
                if isinstance(text_value, str) and text_value.strip():
                    text_parts.append(text_value.strip())
                    continue

                nested_value = _get_field(text_value, "value")
                if isinstance(nested_value, str) and nested_value.strip():
                    text_parts.append(nested_value.strip())

    return "\n\n".join(text_parts).strip()


async def generate_planner_reply(payload: PlannerChatRequest) -> PlannerChatResponse:
    settings = get_settings()
    latest_user_message = next((message.content for message in reversed(payload.messages) if message.role == "user"), "")

    if not settings.openai_api_key:
        return PlannerChatResponse(
            mode=payload.mode,
            reply=_fallback_reply(payload.mode, payload.destination_context, latest_user_message),
            model="fallback",
            created_at=datetime.now(UTC),
            fallback_used=True,
            diagnostic="OPENAI_API_KEY is not configured on the backend.",
        )

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    instructions = _instructions_for_mode(payload.mode, payload.destination_context)
    user_prompt = _conversation_as_text(payload)

    try:
        response = await client.responses.create(
            model=settings.openai_model,
            instructions=instructions,
            input=user_prompt,
            reasoning={"effort": "low"},
            text={"verbosity": "high"},
            max_output_tokens=1800,
        )
    except Exception as exc:
        logger.exception("Planner OpenAI call failed")
        return PlannerChatResponse(
            mode=payload.mode,
            reply=_fallback_reply(payload.mode, payload.destination_context, latest_user_message),
            model="fallback",
            created_at=datetime.now(UTC),
            fallback_used=True,
            diagnostic=f"{type(exc).__name__}: {exc}" if settings.is_development else "OpenAI call failed",
        )

    output_text = _extract_response_text(response)
    if not output_text:
        logger.warning(
            "Planner response contained no extractable text",
            extra={
                "model": settings.openai_model,
                "destination": payload.destination_context,
                "mode": payload.mode,
                "response_id": getattr(response, "id", None),
                "output_items": len(getattr(response, "output", []) or []),
            },
        )
        return PlannerChatResponse(
            mode=payload.mode,
            reply=_fallback_reply(payload.mode, payload.destination_context, latest_user_message),
            model="fallback",
            created_at=datetime.now(UTC),
            fallback_used=True,
            diagnostic="OpenAI returned an empty response payload.",
        )

    return PlannerChatResponse(
        mode=payload.mode,
        reply=output_text,
        model=settings.openai_model,
        created_at=datetime.now(UTC),
        fallback_used=False,
        diagnostic=None,
    )
