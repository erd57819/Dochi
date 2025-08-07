# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GMS_KEY: str # OPENAI_API_KEY에서 변경
    google_application_credentials: str = ""
    google_cloud_project: str = ""
    class Config:
        env_file = ".env"
settings = Settings()