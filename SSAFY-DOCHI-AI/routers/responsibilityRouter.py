from fastapi import APIRouter
from redis import Redis
from kafka_service import produce
import json

router = APIRouter(prefix="/responsibility", tags=["responsibility"])

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

@router.post("/trigger/{room_id}/{chunk_index}")
async def trigger_responsibility_analysis(room_id: str, chunk_index: int):
    key = f"stt:transcript:{room_id}:{chunk_index}"
    lines = r.lrange(key, 0, -1)
    transcript = "\n".join(lines)

    payload = {
        "roomId": room_id,
        "chunkIndex": chunk_index,
        "transcript": transcript
    }

    produce("responsibility-chunk", json.dumps(payload))
    return {"status": "published", "chunk": chunk_index}
