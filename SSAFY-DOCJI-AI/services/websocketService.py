from fastapi import WebSocket
from typing import Dict, Set
import json
from datetime import datetime

class WebsocketService:
    def __init__(self):
        self.activeConnections: Dict[str, Set[WebSocket]] = {}
        self.userRooms: Dict[WebSocket, str] = {}
    
    async def connect(self, websocket: WebSocket, roomId: str, userId: str):
        """WebSocket 연결을 설정합니다."""
        await websocket.accept()
        
        if roomId not in self.activeConnections:
            self.activeConnections[roomId] = set()
        
        self.activeConnections[roomId].add(websocket)
        self.userRooms[websocket] = roomId
        
        print(f"사용자 {userId}가 방 {roomId}에 연결됨")
    
    def disconnect(self, websocket: WebSocket):
        """WebSocket 연결을 해제합니다."""
        roomId = self.userRooms.get(websocket)
        if roomId and roomId in self.activeConnections:
            self.activeConnections[roomId].discard(websocket)
            if not self.activeConnections[roomId]:
                del self.activeConnections[roomId]
        
        if websocket in self.userRooms:
            del self.userRooms[websocket]
    
    async def sendToRoom(self, roomId: str, message: dict, excludeWebsocket: WebSocket = None):
        """특정 방의 모든 사용자에게 메시지를 전송합니다."""
        if roomId in self.activeConnections:
            disconnected = []
            for connection in self.activeConnections[roomId]:
                if connection != excludeWebsocket:
                    try:
                        await connection.send_text(json.dumps(message))
                    except:
                        disconnected.append(connection)
            
            # 끊어진 연결 정리
            for conn in disconnected:
                self.activeConnections[roomId].discard(conn)
    
    def getRoomStatus(self, roomId: str) -> dict:
        """방 상태를 조회합니다."""
        connectionCount = len(self.activeConnections.get(roomId, set()))
        
        return {
            "roomId": roomId,
            "connectedUsers": connectionCount,
            "isActive": connectionCount > 0,
            "timestamp": datetime.now().isoformat()
        }
    
    async def broadcastMessage(self, roomId: str, message: dict) -> dict:
        """특정 방에 메시지를 브로드캐스트합니다."""
        if roomId in self.activeConnections:
            await self.sendToRoom(roomId, message)
            return {
                "success": True,
                "roomId": roomId,
                "message": "메시지가 전송되었습니다",
                "recipients": len(self.activeConnections[roomId])
            }
        else:
            return {
                "success": False,
                "roomId": roomId,
                "message": "활성 연결이 없습니다",
                "recipients": 0
            }