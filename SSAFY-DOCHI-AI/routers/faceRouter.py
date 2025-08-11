from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any
import json
from redis import Redis

# Redis 연결
r = Redis(host="dochi-redis", port=6379, decode_responses=True)

router = APIRouter(prefix="/emotion", tags=["emotion"])

class FaceEmotionInput(BaseModel):
    roomId: str
    speaker: str
    timestamp: str
    emotions: Dict[str, Any]  # e.g. {"dominant": "happy", "frequency": 5, "all": {...}}

@router.post("/face")
async def save_face_emotion(data: FaceEmotionInput):
    """
    갈등 레포트용 표정 데이터를 받아서 Redis에 직접 저장합니다.
    프론트엔드에서 5분간 누적된 감정 데이터를 받습니다.
    """
    try:
        # Redis에 감정 데이터 직접 저장
        emotion_payload = {
            "roomId": data.roomId,
            "speaker": data.speaker,
            "timestamp": data.timestamp,
            "emotions": data.emotions,
            "processedAt": datetime.now().isoformat()
        }
        
        redis_key = f"emotion:face:{data.roomId}:{data.speaker}"
        # Redis Hash로 저장
        r.hset(redis_key, mapping={
            "data": json.dumps(emotion_payload, ensure_ascii=False)
        })
        # 24시간 후 자동 삭제
        r.expire(redis_key, 86400)
        
        print(f"[Redis 감정 저장 완료] Room: {data.roomId}, Speaker: {data.speaker}")

        return {
            "status": "success",
            "message": "표정 데이터가 성공적으로 저장되었습니다.",
            "roomId": data.roomId,
            "speaker": data.speaker,
            "processedAt": emotion_payload["processedAt"]
        }

    except Exception as e:
        print(f"[표정 데이터 처리 오류] {e}")
        raise HTTPException(
            status_code=500,
            detail=f"표정 데이터 처리 중 오류가 발생했습니다: {str(e)}"
        )
