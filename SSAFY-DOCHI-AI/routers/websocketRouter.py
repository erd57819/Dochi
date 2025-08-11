from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from typing import Dict, Set

router = APIRouter()

# 활성 WebSocket 연결들을 관리하는 딕셔너리
# Key: roomId, Value: Set of WebSocket connections
active_connections: Dict[str, Set[WebSocket]] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        """WebSocket 연결"""
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        
        self.active_connections[room_id][user_id] = websocket
        print(f"[WebSocket] 연결됨: {user_id} in room {room_id}")
        
        # 방 참여 알림을 다른 참가자들에게 전송
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "message": f"{user_id}님이 음성 채팅에 참여했습니다."
        }, exclude_user=user_id)
    
    def disconnect(self, room_id: str, user_id: str):
        """WebSocket 연결 해제"""
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            del self.active_connections[room_id][user_id]
            print(f"[WebSocket] 연결 해제됨: {user_id} in room {room_id}")
            
            # 방이 비어있으면 제거
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """개별 메시지 전송"""
        await websocket.send_text(json.dumps(message))
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):
        """방의 모든 사용자에게 메시지 브로드캐스트"""
        if room_id not in self.active_connections:
            return
        
        disconnected_users = []
        
        for user_id, websocket in self.active_connections[room_id].items():
            if exclude_user and user_id == exclude_user:
                continue
                
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                print(f"[WebSocket] 전송 실패 - {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # 연결이 끊어진 사용자들 정리
        for user_id in disconnected_users:
            self.disconnect(room_id, user_id)
    
    def get_room_users(self, room_id: str):
        """방의 현재 사용자 목록 반환"""
        if room_id not in self.active_connections:
            return []
        return list(self.active_connections[room_id].keys())

manager = ConnectionManager()

@router.websocket("/ws/speech-analysis/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    """STT 실시간 공유를 위한 WebSocket 엔드포인트"""
    await manager.connect(websocket, room_id, user_id)
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            message = json.loads(data)
            
            print(f"[WebSocket] 메시지 수신: {user_id} -> {message}")
            
            # STT 결과를 다른 참가자들에게 브로드캐스트
            if message.get("type") == "stt_result":
                broadcast_message = {
                    "type": "stt_result",
                    "speaker": message.get("speaker", user_id),
                    "text": message.get("text", ""),
                    "roomId": room_id,
                    "timestamp": message.get("timestamp", ""),
                    "from_user": user_id
                }
                
                await manager.broadcast_to_room(
                    room_id, 
                    broadcast_message, 
                    exclude_user=user_id
                )
                
            # 기타 메시지 타입들 처리
            elif message.get("type") == "typing":
                # 타이핑 상태 전송
                await manager.broadcast_to_room(
                    room_id,
                    {
                        "type": "typing",
                        "user_id": user_id,
                        "is_typing": message.get("is_typing", False)
                    },
                    exclude_user=user_id
                )
            
            elif message.get("type") == "ping":
                # 연결 상태 확인
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": message.get("timestamp", "")
                }, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        print(f"[WebSocket] 사용자 연결 해제: {user_id} in room {room_id}")
        
        # 연결 해제 알림을 다른 참가자들에게 전송
        await manager.broadcast_to_room(room_id, {
            "type": "user_left",
            "user_id": user_id,
            "message": f"{user_id}님이 음성 채팅에서 나갔습니다."
        })
    
    except Exception as e:
        print(f"[WebSocket] 오류 발생: {e}")
        manager.disconnect(room_id, user_id)

@router.get("/ws/rooms")
def get_active_rooms():
    """현재 활성 방 목록 반환"""
    rooms_info = {}
    for room_id, connections in manager.active_connections.items():
        rooms_info[room_id] = {
            "users": list(connections.keys()),
            "user_count": len(connections)
        }
    
    return {
        "active_rooms": rooms_info,
        "total_rooms": len(manager.active_connections)
    }

@router.get("/ws/rooms/{room_id}/users")
def get_room_users(room_id: str):
    """특정 방의 사용자 목록 반환"""
    users = manager.get_room_users(room_id)
    return {
        "room_id": room_id,
        "users": users,
        "user_count": len(users)
    }