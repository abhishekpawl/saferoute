from pydantic import BaseModel, ConfigDict


class GuardianNearbyItem(BaseModel):
    id: str
    user_id: str
    name: str
    phone_masked: str
    rating_average: float
    rating_count: int
    is_verified: bool
    is_active: bool
    lat: float
    lng: float
    distance_km: float


class GuardianReviewsSummary(BaseModel):
    guardian_id: str
    rating_average: float
    rating_count: int


class GuardianReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    guardian_id: str
    traveler_id: str
    rating: int
    comment: str | None

