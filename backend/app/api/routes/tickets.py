from fastapi import APIRouter

from app.schemas.ticket import TicketSearchIn, TicketSearchOut
from app.services.ticket_service import search_ticket_providers


router = APIRouter()


@router.post("/search", response_model=TicketSearchOut)
async def search_tickets(payload: TicketSearchIn) -> TicketSearchOut:
    providers = search_ticket_providers(payload)
    return TicketSearchOut(
        mode=payload.mode,
        origin=payload.origin,
        destination=payload.destination,
        departure_date=payload.departure_date,
        return_date=payload.return_date,
        live_prices_available=False,
        providers=providers,
        message="Redirect-ready provider comparison is available now. Live fares can be added when official provider APIs or MCP servers are connected.",
    )

