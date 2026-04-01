from fastapi import APIRouter

from app.api.routes import auth, guardians, health, locations, realtime, reviews, sos, users


api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(guardians.router, prefix="/guardians", tags=["guardians"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(sos.router, prefix="/sos", tags=["sos"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(realtime.router, prefix="/ws", tags=["realtime"])

