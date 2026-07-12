import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file
load_dotenv(BASE_DIR / ".env")


class Settings(BaseModel):
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "sqlite:///./transitops.db",
        )
    )


    SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "SECRET_KEY",
            "super_secret_fallback_key_for_development_please_change",
        )
    )

    ALGORITHM: str = Field(
        default_factory=lambda: os.getenv("ALGORITHM", "HS256")
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default_factory=lambda: int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )
    )

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.DATABASE_URL

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        return url

    model_config = {
        "frozen": True
    }


settings = Settings()