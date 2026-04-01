from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.deps import get_current_user
from app.models import GuardianProfile, Review, RoleEnum, User
from app.schemas.review import ReviewCreateIn, ReviewRead


router = APIRouter()


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ReviewCreateIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ReviewRead:
    if current_user.role != RoleEnum.TRAVELER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only travelers can create reviews")

    guardian_result = await session.execute(select(GuardianProfile).where(GuardianProfile.id == payload.guardian_id))
    guardian = guardian_result.scalar_one_or_none()
    if guardian is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Guardian not found")

    review = Review(
        guardian_id=payload.guardian_id,
        traveler_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    session.add(review)

    new_count = guardian.rating_count + 1
    guardian.rating_average = ((guardian.rating_average * guardian.rating_count) + payload.rating) / new_count
    guardian.rating_count = new_count

    await session.commit()
    await session.refresh(review)
    return ReviewRead.model_validate(review)


@router.get("/guardian/{guardian_id}", response_model=list[ReviewRead])
async def list_guardian_reviews(
    guardian_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> list[ReviewRead]:
    result = await session.execute(
        select(Review).where(Review.guardian_id == guardian_id).order_by(Review.created_at.desc())
    )
    return [ReviewRead.model_validate(review) for review in result.scalars().all()]

