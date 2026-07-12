from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


is_sqlite = settings.sqlalchemy_database_url.startswith("sqlite")

connect_args = {}

if is_sqlite:
    connect_args["check_same_thread"] = False


engine_kwargs = {
    "connect_args": connect_args,
    "echo": False,
}

if not is_sqlite:
    engine_kwargs.update(
        {
            "pool_size": 20,
            "max_overflow": 10,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "pool_pre_ping": True,
        }
    )


engine = create_engine(
    settings.sqlalchemy_database_url,
    future=True,
    **engine_kwargs,
)


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Iterator[Session]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()