from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.models.entities import Base


settings = get_settings()
engine = create_async_engine(settings.database_url, echo=settings.is_development, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def create_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

