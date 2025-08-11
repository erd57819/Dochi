from fastapi import APIRouter
from redis import Redis
import json

router = APIRouter(prefix="/responsibility", tags=["responsibility"])

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

@router.post("/trigger/{room_id}/{chunk_index}")
async def trigger_responsibility_analysis(room_id: str, chunk_index: int):
    """
    이 엔드포인트는 더 이상 사용되지 않습니다.
    갈등 분석은 /conflict-report/{room_id}에서 통합 처리됩니다.
    """
    return {
        "status": "deprecated", 
        "message": "Use /conflict-report/{room_id} for conflict analysis",
        "room_id": room_id,
        "chunk_index": chunk_index
    }
