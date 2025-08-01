from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from datetime import datetime
from schemas.speechSchemas import SpeechProcessingResponse, RealtimeChunkResponse
from services.speechService import SpeechService

router = APIRouter(prefix="/speech", tags=["speech_processing"])
speechService = SpeechService()

@router.post("/process-audio", response_model=SpeechProcessingResponse)
async def processAudio(
    audioFile: UploadFile = File(...),
    speakerId: str = Form(...),
    roomId: str = Form(...),
    conversationContext: str = Form(default="[]")
):
    """음성 파일을 받아서 STT 변환 및 분석을 처리합니다."""
    
    if not audioFile.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다. 지원 형식: wav, mp3, webm, ogg, m4a"
        )
    
    try:
        audioContent = await audioFile.read()
        
        result = await speechService.processAudio(
            audioContent, speakerId, roomId, conversationContext
        )
        
        return SpeechProcessingResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"음성 처리 중 예상치 못한 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/process-realtime-chunk")
async def processRealtimeChunk(
    audioChunk: UploadFile = File(...),
    speakerId: str = Form(...),
    roomId: str = Form(...),
    chunkSequence: int = Form(default=0),
    isFinal: bool = Form(default=False)
):
    """실시간 오디오 청크를 처리합니다 (WebRTC 스트림용)."""
    
    try:
        audioContent = await audioChunk.read()
        
        result = await speechService.processRealtimeChunk(
            audioContent, speakerId, roomId, chunkSequence, isFinal
        )
        
        return result
    
    except Exception as e:
        print(f"실시간 청크 처리 오류: {e}")
        return {
            "error": str(e),
            "chunkSequence": chunkSequence,
            "speakerId": speakerId,
            "roomId": roomId,
            "processedAt": datetime.now().isoformat()
        }

@router.get("/health")
async def healthCheck():
    """음성 처리 서비스 상태를 확인합니다."""
    return {
        "status": "healthy",
        "service": "speech-processing",
        "version": "1.0.0",
        "features": {
            "speechToText": "Google Speech Recognition + Whisper 백업",
            "emotionAnalysis": "키워드 기반 감정 분석",
            "conflictDetection": "다층 갈등 위험도 분석",
            "realtimeProcessing": "실시간 오디오 청크 처리",
            "feedbackGeneration": "상황별 대화 개선 제안"
        },
        "supportedFormats": ["wav", "mp3", "webm", "ogg", "m4a"],
        "languages": ["ko-KR", "en-US"],
        "timestamp": datetime.now().isoformat()
    }