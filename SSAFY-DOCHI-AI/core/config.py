# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    GMS_KEY: str = Field(alias="GMS_KEY")
    google_application_credentials: str = Field(default="", alias="GOOGLE_APPLICATION_CREDENTIALS")
    google_cloud_project: str = Field(default="", alias="GOOGLE_CLOUD_PROJECT")

# 설정 로딩 시 디버깅 정보 출력
settings = Settings()
print(f"[Config] GMS_KEY 로드됨: {'있음' if settings.GMS_KEY else '없음'}")