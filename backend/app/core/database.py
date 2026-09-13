from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

is_sqlite = "sqlite" in settings.async_database_url
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

def _run_migrations(connection):
    from sqlalchemy import inspect, text
    inspector = inspect(connection)
    tables = inspector.get_table_names()

    if "users" in tables:
        columns = [c["name"] for c in inspector.get_columns("users")]
        if "hashed_password" not in columns and "password_hash" in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))
            connection.execute(text("UPDATE users SET hashed_password = password_hash WHERE hashed_password IS NULL"))
        if "full_name" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
        if "organization_name" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN organization_name VARCHAR(255)"))
        if "is_active" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"))
            connection.execute(text("UPDATE users SET is_active = 1 WHERE is_active IS NULL"))

    if "assessments" in tables:
        columns = [c["name"] for c in inspector.get_columns("assessments")]
        if "user_id" not in columns:
            connection.execute(text("ALTER TABLE assessments ADD COLUMN user_id VARCHAR(36)"))
            if "owner_id" in columns:
                connection.execute(text("UPDATE assessments SET user_id = owner_id WHERE user_id IS NULL"))

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_run_migrations)
