from dataclasses import dataclass
from datetime import date
from urllib.parse import quote_plus

from app.schemas.ticket import TicketProviderResult, TicketSearchIn


@dataclass(frozen=True)
class ProviderConfig:
    provider_id: str
    provider_name: str
    flight_url: str
    train_url: str
    bus_url: str

    def url_for_mode(self, mode: str) -> str:
        return {
            "AIR": self.flight_url,
            "TRAIN": self.train_url,
            "BUS": self.bus_url,
        }[mode]


PROVIDERS: tuple[ProviderConfig, ...] = (
    ProviderConfig(
        provider_id="makemytrip",
        provider_name="MakeMyTrip",
        flight_url="https://www.makemytrip.com/flights/",
        train_url="https://www.makemytrip.com/railways/",
        bus_url="https://www.makemytrip.com/bus-tickets/",
    ),
    ProviderConfig(
        provider_id="goibibo",
        provider_name="Goibibo",
        flight_url="https://www.goibibo.com/flights/",
        train_url="https://www.goibibo.com/trains",
        bus_url="https://www.goibibo.com/bus/",
    ),
    ProviderConfig(
        provider_id="yatra",
        provider_name="Yatra",
        flight_url="https://www.yatra.com/flights",
        train_url="https://www.yatra.com/trains.html",
        bus_url="https://www.yatra.com/bus-tickets",
    ),
)


def _mode_label(mode: str) -> str:
    return {
        "AIR": "flight",
        "TRAIN": "train",
        "BUS": "bus",
    }[mode]


def _search_hint(payload: TicketSearchIn) -> str:
    base = f"{payload.origin} to {payload.destination} on {payload.departure_date.isoformat()}"
    if payload.mode == "AIR":
        traveller_summary = f"{payload.adults} adult"
        if payload.adults > 1:
            traveller_summary += "s"
        if payload.children:
            traveller_summary += f", {payload.children} child"
            if payload.children > 1:
                traveller_summary += "ren"
        if payload.infants:
            traveller_summary += f", {payload.infants} infant"
            if payload.infants > 1:
                traveller_summary += "s"
        cabin = (payload.cabin_class or "ECONOMY").replace("_", " ").title()
        return f"Search {base}. Travellers: {traveller_summary}. Class: {cabin}."
    return f"Search {base}."


def _note_lines(provider_name: str, mode: str) -> list[str]:
    mode_label = _mode_label(mode)
    return [
        f"Opens {provider_name}'s {mode_label} search experience.",
        "Live fares will appear here once an official provider API or MCP integration is connected.",
    ]


def _provider_result(provider: ProviderConfig, payload: TicketSearchIn) -> TicketProviderResult:
    base_url = provider.url_for_mode(payload.mode)
    search_hint = _search_hint(payload)

    # The current implementation redirects to the provider's official mode-specific landing page.
    # We preserve the search hint in the UI instead of sending brittle unofficial query params.
    deeplink_url = f"{base_url}?utm_source=saferoute&utm_medium=redirect&utm_campaign=ticket_compare&q={quote_plus(search_hint)}"

    return TicketProviderResult(
        provider_id=provider.provider_id,
        provider_name=provider.provider_name,
        mode=payload.mode,
        deeplink_url=deeplink_url,
        source_home_url=base_url,
        live_price_supported=False,
        fare_display=None,
        currency="INR",
        search_hint=search_hint,
        notes=_note_lines(provider.provider_name, payload.mode),
    )


def search_ticket_providers(payload: TicketSearchIn) -> list[TicketProviderResult]:
    return [_provider_result(provider, payload) for provider in PROVIDERS]

