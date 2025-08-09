# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    GMS_KEY: str # OPENAI_API_KEY에서 변경
    mysql_root_password: str
    jwt_secret: str
    spring_profiles_active: str
    email_username: str
    email_password: str
    kakao_rest_api_key: str
    kakao_redirect_uri: str
    kakao_redirect_withdraw_uri: str
    aws_s3_bucket: str
    aws_access_key: str
    aws_secret_key: str
    root_pw: str
    livekit_api_key: str
    livekit_api_secret: str
    domain_or_public_ip: str
    openvidu_secret: str
    openvidu_url: str
    certificate_type: str
    https_port: str
    http_port: str
    social_pw: str

    google_application_credentials: str = ""
    google_cloud_project: str = ""

    kafka_bootstrap_servers: str = Field(default="localhost:9092", alias="KAFKA_BOOTSTRAP_SERVERS")  
    use_kafka: bool = Field(default=False, alias="USE_KAFKA")  # Kafka 사용 여부

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

# 설정 로딩 시 디버깅 정보 출력
settings = Settings()
print(f"[Config] GMS_KEY 로드됨: {'있음' if settings.GMS_KEY else '없음'}")
print(f"[Config] Kafka 서버: {settings.kafka_bootstrap_servers}")
print(f"[Config] Kafka 사용: {settings.use_kafka}")

