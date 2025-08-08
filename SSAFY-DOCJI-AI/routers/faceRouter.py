from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Dict

router = APIRouter(prefix="/emotion", tags=["emotion"])

class FaceEmotionInput(BaseModel):
    roomId: str
    speaker: str
    timestamp: datetime
    emotions: Dict[str, float]  # e.g. {"happy": 0.4, "angry": 0.2}

@router.post("/face")
async def save_face_emotion(data: FaceEmotionInput):
    # Kafka에 보내거나 Redis에 저장, 또는 DB 저장
    print(f"[표정 데이터 수신] {data.roomId} / {data.speaker} : {data.emotions}")
    return {"status": "ok"}
