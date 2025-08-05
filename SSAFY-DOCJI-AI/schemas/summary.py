# app/schemas/summary.py
from pydantic import BaseModel, ConfigDict
from enum import Enum

class ModelType(str, Enum):
    gpt = "gpt"
    gemini = "gemini"

class SummaryRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    original_text: str
    model_type: ModelType = ModelType.gpt  # 기본값으로 gpt 설정

class SummaryResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    summary_text: str

class AdvancedAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    original_text: str
    conflict_type: str
    model_type: ModelType = ModelType.gpt