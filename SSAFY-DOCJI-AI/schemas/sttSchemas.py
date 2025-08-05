from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict

class SttRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    model: str = "whisper-1"
    language: str = "ko-KR"

class SttResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    transcript: str
    processingTime: float
    model: str
    processedAt: str

class SttAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    model: str = "whisper-1"
    language: str = "ko-KR"
    analyzeEmotion: bool = True
    analyzeConflict: bool = True

class SttAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    transcript: str
    processingTime: float
    model: str
    emotionAnalysis: Optional[Dict] = None
    conflictRisk: Optional[str] = None
    suggestions: Optional[List[str]] = None
    processedAt: str

class EmotionAnalysis(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    emotion: str
    confidence: float
    intensity: float
    detectedKeywords: List[str]

class ConflictAnalysis(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    riskLevel: str
    riskScore: float
    indicators: List[str]
    rawScore: float