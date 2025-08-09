# app/core/config.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# lower_snake_case → UPPER_SNAKE_CASE
def to_env(name: str) -> str:
    return name.upper()

# .env 경로 삽입
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    gms_key: str  # .env: GMS_KEY

    # 선택값(기본값 제공) — 없으면 빈 문자열
    google_application_credentials: str = ""
    google_cloud_project: str = ""

    # 기본값 존재
    kafka_bootstrap_servers: str = "localhost:9092"
    use_kafka: bool = False

    # Pydantic v2 설정
    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),          # 동일 디렉토리면 ".env"로 바꾸세요
        env_file_encoding="utf-8",
        extra="ignore",
        alias_generator=to_env,          # <- 여기서 자동 alias 생성!
        populate_by_name=True,           # 이름으로도 주입 가능(테스트 등에 유용)
    )

settings = Settings()
print(f"[Config] GMS_KEY 로드됨: {'있음' if bool(settings.gms_key) else '없음'}")
print(f"[Config] Kafka 서버: {settings.kafka_bootstrap_servers}")
print(f"[Config] Kafka 사용: {settings.use_kafka}")
