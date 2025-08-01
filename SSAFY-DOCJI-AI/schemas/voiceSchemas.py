from pydantic import BaseModel

class VoiceProcessingRequest(BaseModel):
    language: str = "ko-KR"
    ttsLanguage: str = "ko"
    speed: float = 1.0
    voiceType: str = "female"

class VoiceProcessingResponse(BaseModel):
    transcript: str
    confidence: float
    responseText: str
    audioBase64: str
    processedAt: str

class TtsRequest(BaseModel):
    text: str
    language: str = "ko"
    speed: float = 1.0
    voiceType: str = "female"

class SttOnlyRequest(BaseModel):
    language: str = "ko-KR"

class SttOnlyResponse(BaseModel):
    transcript: str
    confidence: float
    processedAt: str