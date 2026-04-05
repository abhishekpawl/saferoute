from datetime import date

from pydantic import BaseModel, Field, HttpUrl, model_validator


class TicketMode(str):
    AIR = "AIR"
    TRAIN = "TRAIN"
    BUS = "BUS"


class CabinClass(str):
    ECONOMY = "ECONOMY"
    PREMIUM_ECONOMY = "PREMIUM_ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"


class TicketSearchIn(BaseModel):
    mode: str = Field(pattern="^(AIR|TRAIN|BUS)$")
    origin: str = Field(min_length=2, max_length=80)
    destination: str = Field(min_length=2, max_length=80)
    departure_date: date
    return_date: date | None = None
    adults: int = Field(default=1, ge=1, le=9)
    children: int = Field(default=0, ge=0, le=8)
    infants: int = Field(default=0, ge=0, le=4)
    cabin_class: str | None = Field(default=None, pattern="^(ECONOMY|PREMIUM_ECONOMY|BUSINESS|FIRST)$")

    @model_validator(mode="after")
    def validate_dates(self) -> "TicketSearchIn":
        if self.return_date and self.return_date < self.departure_date:
            raise ValueError("Return date cannot be before departure date")
        return self


class TicketProviderResult(BaseModel):
    provider_id: str
    provider_name: str
    mode: str
    deeplink_url: HttpUrl
    source_home_url: HttpUrl
    live_price_supported: bool = False
    fare_display: str | None = None
    currency: str | None = None
    search_hint: str
    redirect_label: str = "Open On Site"
    notes: list[str] = Field(default_factory=list)


class TicketSearchOut(BaseModel):
    mode: str
    origin: str
    destination: str
    departure_date: date
    return_date: date | None
    live_prices_available: bool
    providers: list[TicketProviderResult]
    message: str

