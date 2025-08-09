from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api", tags=["api_info"])

@router.get("/")
def getApiInfo():
    """AI 서버 API 정보를 반환합니다."""
    return {
        "name": "SSAFY DOCHI AI Server",
        "version": "2.0.0",
        "description": "AI-powered conflict mediation platform - Speech and Text Analysis API",
        "endpoints": {
            "stt": {
                "transcribe": "POST /stt/transcribe",
                "transcribeAndAnalyze": "POST /stt/transcribe-and-analyze",
                "health": "GET /stt/health"
            },
            "speech": {
                "processAudio": "POST /speech/process-audio",
                "processRealtimeChunk": "POST /speech/process-realtime-chunk",
                "health": "GET /speech/health"
            },
            "voice": {
                "processVoice": "POST /voice/process-voice",
                "textToSpeech": "POST /voice/text-to-speech",
                "speechToText": "POST /voice/speech-to-text",
                "health": "GET /voice/health"
            },
            "summary": {
                "basic": "POST /api/summary/",
                "advanced": "POST /api/summary/advanced"
            },
            "websocket": {
                "speechAnalysis": "WS /ws/speech-analysis/{roomId}/{userId}"
            }
        },
        "serverTime": datetime.now().isoformat()
    }

@router.get("/status")
def getServerStatus():
    """서버 상태를 반환합니다."""
    return {
        "status": "running",
        "uptime": "available",
        "services": {
            "stt": "active",
            "speech": "active", 
            "voice": "active",
            "summary": "active",
            "websocket": "active"
        },
        "timestamp": datetime.now().isoformat()
    }