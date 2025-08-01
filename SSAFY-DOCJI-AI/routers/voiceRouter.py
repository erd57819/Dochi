from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from datetime import datetime
import io
from schemas.voiceSchemas import VoiceProcessingResponse, TtsRequest, SttOnlyResponse
from services.voiceService import VoiceService

router = APIRouter(prefix="/voice", tags=["voice_processing"])
voiceService = VoiceService()

@router.post("/process-voice", response_model=VoiceProcessingResponse)
async def processVoice(
    audioFile: UploadFile = File(...),
    language: str = Form(default="ko-KR"),
    ttsLanguage: str = Form(default="ko"),
    speed: float = Form(default=1.0),
    voiceType: str = Form(default="female")
):
    """음성 파일을 받아서 STT → 응답 생성 → TTS 처리합니다."""
    
    if not audioFile.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다"
        )
    
    try:
        audioContent = await audioFile.read()
        
        result = await voiceService.processVoice(
            audioContent, language, ttsLanguage, speed, voiceType
        )
        
        return VoiceProcessingResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"음성 처리 중 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/text-to-speech")
async def textToSpeech(request: TtsRequest):
    """텍스트를 음성으로 변환하여 오디오 파일을 반환합니다."""
    
    try:
        audioData = await voiceService.generateTts(
            request.text, request.language, request.speed, request.voiceType
        )
        
        return StreamingResponse(
            io.BytesIO(audioData),
            media_type="audio/mp3",
            headers={
                "Content-Disposition": "attachment; filename=tts_output.mp3"
            }
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"TTS 처리 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/speech-to-text", response_model=SttOnlyResponse)
async def speechToTextOnly(
    audioFile: UploadFile = File(...),
    language: str = Form(default="ko-KR")
):
    """음성 파일을 텍스트로만 변환합니다."""
    
    if not audioFile.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="오디오 파일만 업로드 가능합니다")
    
    try:
        audioContent = await audioFile.read()
        
        transcript, confidence = voiceService.speechToText(audioContent, language)
        
        return SttOnlyResponse(
            transcript=transcript.strip(),
            confidence=confidence,
            processedAt=datetime.now().isoformat()
        )
    
    except Exception as e:
        print(f"STT 처리 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"STT 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
async def healthCheck():
    """음성 처리 서비스 상태를 확인합니다."""
    return {
        "status": "healthy",
        "service": "voice-processing",
        "version": "1.0.0",
        "features": {
            "speechToText": "Google Speech Recognition",
            "textToSpeech": "Google TTS + pyttsx3",
            "voiceChat": "STT + Response Generation + TTS",
            "languages": ["ko-KR", "en-US"],
            "audioFormats": ["wav", "mp3", "webm", "ogg", "m4a"]
        },
        "timestamp": datetime.now().isoformat()
    }