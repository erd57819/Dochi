from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from datetime import datetime
from schemas.speechSchemas import SpeechProcessingResponse, RealtimeChunkResponse
from services.speechService import SpeechService
import typing
from pydantic import BaseModel
from services.emotionService import EmotionService 

router = APIRouter(prefix="/speech", tags=["speech_processing"])
speechService = SpeechService()

class Utterance(BaseModel):
    speaker: str
    text: str

class ConversationRequest(BaseModel):
    conversation: typing.List[Utterance]
    
    
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
        
@router.post("/emotion/contextual", summary="Analyze emotion from conversation context")
def analyze_contextual_emotion(request: ConversationRequest):
    """
    화자와 대화 내용을 포함한 전체 대화 기록을 받아,
    문맥을 고려하여 마지막 발언의 감정을 분석합니다.
    """
    if not request.conversation:
        raise HTTPException(status_code=400, detail="Conversation data is required.")

    try:
        # EmotionService를 인스턴스화하고 분석 함수 호출
        emotion_service = EmotionService()
        
        # Pydantic 모델을 Python dict 리스트로 변환하여 전달
        conversation_data = [item.dict() for item in request.conversation]
        
        result = emotion_service.analyze_conversation_emotion(conversation_data)
        
        if result.get("emotion") == "error":
             raise HTTPException(status_code=500, detail=f"AI Service Error: {result.get('message')}")
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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