# app/schemas/summary.py
from pydantic import BaseModel, ConfigDict
from enum import Enum

class ModelType(str, Enum):
    gpt = "gpt"
    gemini = "gemini"

# 기본 요약 스키마 제거됨 - 통합 분석만 사용

class AdvancedAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    original_text: str
    conflict_type: str
    model_type: ModelType = ModelType.gpt


# 중복 스키마 제거됨