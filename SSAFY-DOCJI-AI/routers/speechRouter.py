from fastapi import APIRouter, HTTPException
from datetime import datetime
import typing
from pydantic import BaseModel
from services.emotionService import EmotionService 
from services.kafkaService import produce
import json

router = APIRouter(prefix="/speech", tags=["speech_processing"])

class Utterance(BaseModel):
    speaker: str
    text: str

class ConversationRequest(BaseModel):
    conversation: typing.List[Utterance]
    
    
        
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
            "conflictSTTProcessing": "갈등 분석용 STT 데이터 처리",
            "emotionAnalysis": "키워드 기반 감정 분석",
            "conflictDetection": "다층 갈등 위험도 분석",
            "kafkaIntegration": "Kafka 기반 데이터 파이프라인"
        },
        "dataFormats": ["JSON STT", "JSON Emotion"],
        "languages": ["ko-KR"],
        "timestamp": datetime.now().isoformat()
    }

class ConflictSTTData(BaseModel):
    roomId: str
    speakerId: str
    text: str
    timestamp: str

@router.post("/process-conflict-chunk")
async def processConflictChunk(data: ConflictSTTData):
    """
    갈등 레포트용 STT 데이터를 받아서 Kafka로 전송합니다.
    프론트엔드에서 JSON 형태의 STT 데이터를 받습니다.
    """
    try:
        # Kafka로 STT 데이터 전송
        kafka_payload = {
            "roomId": data.roomId,
            "speakerId": data.speakerId,
            "text": data.text,
            "timestamp": data.timestamp,
            "processedAt": datetime.now().isoformat()
        }

        produce("conflict-stt", json.dumps(kafka_payload, ensure_ascii=False))
        print(f"[Kafka STT 발행 완료] {kafka_payload}")

        return {
            "status": "success",
            "message": "STT 데이터가 성공적으로 처리되었습니다.",
            "roomId": data.roomId,
            "speakerId": data.speakerId,
            "processedAt": kafka_payload["processedAt"]
        }

    except Exception as e:
        print(f"[ConflictSTT 처리 오류] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"STT 데이터 처리 중 오류가 발생했습니다: {str(e)}"
        )
