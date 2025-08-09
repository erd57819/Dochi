from pydantic import BaseModel, ConfigDict
from typing import List, Dict

class SpeechProcessingRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    speakerId: str
    roomId: str
    conversationContext: str = "[]"

class SpeechProcessingResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    transcript: str
    confidence: float
    emotionAnalysis: Dict
    conflictRisk: str
    suggestions: List[str]
    processedAt: str

class RealtimeChunkRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    speakerId: str
    roomId: str
    chunkSequence: int = 0
    isFinal: bool = False

class RealtimeChunkResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    partialTranscript: str
    confidence: float
    chunkSequence: int
    speakerId: str
    roomId: str
    isFinal: bool
    processedAt: str
    emotionAnalysis: Dict = None
    conflictRisk: str = None
    suggestions: List[str] = None