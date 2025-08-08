# app/core/config.py
from pydantic_settings import BaseSettings

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
    class Config:
        env_file = ".env"

settings = Settings()