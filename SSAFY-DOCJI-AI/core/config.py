# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # .env: GMS_KEY
    gms_key: str

    google_application_credentials: str = ""
    google_cloud_project: str = ""

    kafka_bootstrap_servers: str = Field(default="localhost:9092", alias="KAFKA_BOOTSTRAP_SERVERS")
    use_kafka: bool = Field(default=False, alias="USE_KAFKA")  # Kafka 사용 여부

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

# 설정 로딩 시 디버깅 정보 출력
settings = Settings()
print(f"[Config] GMS_KEY 로드됨: {'있음' if settings.gms_key else '없음'}")
print(f"[Config] Kafka 서버: {settings.kafka_bootstrap_servers}")
print(f"[Config] Kafka 사용: {settings.use_kafka}")

