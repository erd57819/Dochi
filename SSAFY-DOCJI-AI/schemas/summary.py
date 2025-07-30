# app/schemas/summary.py
from pydantic import BaseModel
from enum import Enum

class ModelType(str, Enum):
    gpt = "gpt"
    gemini = "gemini"

class SummaryRequest(BaseModel):
    original_text: str
    model_type: ModelType = ModelType.gpt  # 기본값으로 gpt 설정

class SummaryResponse(BaseModel):
    summary_text: str

class AdvancedAnalysisRequest(BaseModel):
    original_text: str
    conflict_type: str
    model_type: ModelType = ModelType.gpt