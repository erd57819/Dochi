from pydantic import BaseModel
from typing import Optional, List, Dict

class SttRequest(BaseModel):
    model: str = "whisper-1"
    language: str = "ko-KR"

class SttResponse(BaseModel):
    transcript: str
    processingTime: float
    model: str
    processedAt: str

class SttAnalysisRequest(BaseModel):
    model: str = "whisper-1"
    language: str = "ko-KR"
    analyzeEmotion: bool = True
    analyzeConflict: bool = True

class SttAnalysisResponse(BaseModel):
    transcript: str
    processingTime: float
    model: str
    emotionAnalysis: Optional[Dict] = None
    conflictRisk: Optional[str] = None
    suggestions: Optional[List[str]] = None
    processedAt: str

class EmotionAnalysis(BaseModel):
    emotion: str
    confidence: float
    intensity: float
    detectedKeywords: List[str]

class ConflictAnalysis(BaseModel):
    riskLevel: str
    riskScore: float
    indicators: List[str]
    rawScore: float