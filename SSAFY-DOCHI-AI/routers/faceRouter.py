from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any
from services.kafkaService import produce
import json

router = APIRouter(prefix="/emotion", tags=["emotion"])

class FaceEmotionInput(BaseModel):
    roomId: str
    speaker: str
    timestamp: str
    emotions: Dict[str, Any]  # e.g. {"dominant": "happy", "frequency": 5, "all": {...}}

@router.post("/face")
async def save_face_emotion(data: FaceEmotionInput):
    """
    갈등 레포트용 표정 데이터를 받아서 Kafka로 전송합니다.
    프론트엔드에서 5분간 누적된 감정 데이터를 받습니다.
    """
    try:
        # Kafka로 표정 데이터 전송
        kafka_payload = {
            "roomId": data.roomId,
            "speaker": data.speaker,
            "timestamp": data.timestamp,
            "emotions": data.emotions,
            "processedAt": datetime.now().isoformat()
        }

        produce("conflict-emotion", json.dumps(kafka_payload, ensure_ascii=False))
        print(f"[Kafka 표정 발행 완료] {kafka_payload}")

        return {
            "status": "success",
            "message": "표정 데이터가 성공적으로 처리되었습니다.",
            "roomId": data.roomId,
            "speaker": data.speaker,
            "processedAt": kafka_payload["processedAt"]
        }

    except Exception as e:
        print(f"[표정 데이터 처리 오류] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"표정 데이터 처리 중 오류가 발생했습니다: {str(e)}"
        )
