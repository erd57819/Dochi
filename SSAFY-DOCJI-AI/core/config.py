# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GMS_KEY: str # OPENAI_API_KEY에서 변경
<<<<<<< HEAD

    google_application_credentials: str = ""
    google_cloud_project: str = ""

=======
    google_application_credentials: str = ""
    google_cloud_project: str = ""
>>>>>>> a173bb5c177117988ddc6461c5a5eb1827fded65
    class Config:
        env_file = ".env"
settings = Settings()