from pydantic import BaseModel, ConfigDict

class VoiceProcessingRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    language: str = "ko-KR"
    ttsLanguage: str = "ko"
    speed: float = 1.0
    voiceType: str = "female"

class VoiceProcessingResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    transcript: str
    confidence: float
    responseText: str
    audioBase64: str
    processedAt: str

class TtsRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    text: str
    language: str = "ko"
    speed: float = 1.0
    voiceType: str = "female"

class SttOnlyRequest(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    language: str = "ko-KR"

class SttOnlyResponse(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    transcript: str
    confidence: float
    processedAt: str