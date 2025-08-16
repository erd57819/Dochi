from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from redis import Redis
import json
import asyncio
from typing import AsyncGenerator
from datetime import datetime

router = APIRouter(prefix="/sse", tags=["sse"])

# Redis 연결
r = Redis(host="dochi-redis", port=6379, decode_responses=True)

@router.get("/room/{room_id}/stream")
async def stream_room_stt(room_id: str):
    """
    특정 방의 STT 데이터를 실시간으로 스트리밍합니다.
    Server-Sent Events (SSE) 형식으로 전송
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        # Redis Pub/Sub 구독
        pubsub = r.pubsub()
        channel = f"room:{room_id}:stt"
        pubsub.subscribe(channel)
        
        try:
            # 초기 연결 메시지
            yield f"data: {json.dumps({'type': 'connected', 'roomId': room_id, 'timestamp': datetime.now().isoformat()})}\n\n"
            
            # 메시지 수신 대기
            while True:
                message = pubsub.get_message(timeout=1.0)
                if message and message['type'] == 'message':
                    # Redis Pub/Sub 메시지 전송
                    yield f"data: {message['data']}\n\n"
                
                # 주기적으로 heartbeat 전송 (연결 유지)
                await asyncio.sleep(0.1)
                
        except Exception as e:
            print(f"[SSE Error] {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        finally:
            pubsub.unsubscribe(channel)
            pubsub.close()
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/room/{room_id}/recent")
async def get_recent_stt(room_id: str, limit: int = 50):
    """
    방의 최근 STT 데이터를 가져옵니다.
    Redis에서 최근 대화 내용 조회
    """
    try:
        # Redis에서 전체 대화 가져오기
        raw_key = f"stt:raw:{room_id}"
        lines = r.lrange(raw_key, -limit, -1)  # 최근 limit개
        
        conversations = []
        for idx, line in enumerate(lines):
            # "speaker: text" 형식 파싱
            if ": " in line:
                speaker, text = line.split(": ", 1)
                conversations.append({
                    "id": f"redis_{idx}",
                    "speaker": speaker,
                    "text": text,
                    "timestamp": datetime.now().isoformat(),
                    "source": "redis"
                })
        
        return {
            "roomId": room_id,
            "conversations": conversations,
            "count": len(conversations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
