from fastapi import APIRouter, HTTPException
from datetime import datetime
import typing
from pydantic import BaseModel
from services.emotionService import EmotionService 
from services.coachingService import CoachingService
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
            "realtimeCoaching": "실시간 대화 코칭 시스템",
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
        # Redis Pub/Sub으로 실시간 브로드캐스트
        import redis
        r = redis.Redis(host="dochi-redis", port=6379, decode_responses=True)
        
        pubsub_data = {
            "speaker": data.speakerId,
            "text": data.text,
            "timestamp": data.timestamp,
            "type": "stt_result"
        }
        r.publish(f"room:{data.roomId}:stt", json.dumps(pubsub_data, ensure_ascii=False))
        print(f"[Redis Pub/Sub 발행] room:{data.roomId}:stt → {pubsub_data}")
        
        # Kafka로 STT 데이터 전송 (저장용)

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

# 코칭 서비스 인스턴스 생성
coaching_service = CoachingService()
emotion_service = EmotionService()

class RealtimeCoachingRequest(BaseModel):
    conversation: typing.List[Utterance]  # 최근 대화 내용
    roomId: typing.Optional[str] = None
    silenceDuration: typing.Optional[float] = 0  # 침묵 시간 (초)

@router.post("/coaching/realtime", summary="Real-time conversation coaching")
async def process_realtime_coaching(request: RealtimeCoachingRequest):
    """
    실시간 화상 대화 중 코칭 분석 및 제공
    프론트엔드에서 주기적으로 호출하여 코칭이 필요한지 확인합니다.
    
    대화 내용을 Google API로 감정 분석한 후 Claude AI가 코칭 메시지를 생성합니다.
    - conversation 배열을 받아서 처리
    - 각 발언을 Google API로 감정 분석
    - 감정 패턴과 대화 내용을 Claude에 전달하여 맞춤 코칭
    """
    try:
        if not request.conversation:
            raise HTTPException(status_code=400, detail="Conversation data is required.")

        # 대화 데이터를 변환
        conversation_data = [item.dict() for item in request.conversation]
        
        # CoachingService에서 감정 분석 + 코칭 처리
        coaching_result = coaching_service.analyze_and_coach(
            conversation_data, 
            request.silenceDuration or 0
        )
        
        # 응답 데이터 구성
        response_data = {
            "coachingNeeded": coaching_result.get("coachingNeeded", False),
            "triggerType": coaching_result.get("triggerType"),
            "urgency": coaching_result.get("urgency", "low"),
            "reason": coaching_result.get("reason", ""),
            "nextCheckInterval": coaching_result.get("nextCheckInterval", 60),
        }
        
        # 코칭 메시지가 있으면 추가
        if coaching_result.get("coachingMessage"):
            response_data["coachingMessage"] = f"🤖 AI 코칭: {coaching_result['coachingMessage']}"
            print(f"[Coaching Triggered] Room: {request.roomId}, Type: {coaching_result['triggerType']}")
        
        return response_data
        
    except Exception as e:
        print(f"[Realtime Coaching Error] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"코칭 분석 중 오류가 발생했습니다: {str(e)}"
        )
