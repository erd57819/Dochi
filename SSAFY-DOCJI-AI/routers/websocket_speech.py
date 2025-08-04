from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio
import base64
import tempfile
import os
from datetime import datetime
from .speech_processing import speech_to_text, analyze_emotion_from_text, analyze_conflict_risk, generate_feedback_suggestions
from .emotion_model import detect_emotion_from_image

router = APIRouter()

# 활성 WebSocket 연결 관리
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_rooms: Dict[WebSocket, str] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        
        self.active_connections[room_id].add(websocket)
        self.user_rooms[websocket] = room_id
        
        print(f"사용자 {user_id}가 방 {room_id}에 연결됨")
    
    def disconnect(self, websocket: WebSocket):
        room_id = self.user_rooms.get(websocket)
        if room_id and room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
        
        if websocket in self.user_rooms:
            del self.user_rooms[websocket]
    
    async def send_to_room(self, room_id: str, message: dict, exclude_websocket: WebSocket = None):
        if room_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_text(json.dumps(message))
                    except:
                        disconnected.append(connection)
            
            # 끊어진 연결 정리
            for conn in disconnected:
                self.active_connections[room_id].discard(conn)

manager = ConnectionManager()

@router.websocket("/ws/speech-analysis/{room_id}/{user_id}")
async def websocket_speech_analysis(websocket: WebSocket, room_id: str, user_id: str):
    """
    실시간 음성 분석을 위한 WebSocket 엔드포인트
    클라이언트에서 오디오 데이터를 실시간으로 전송받아 처리
    """
    
    await manager.connect(websocket, room_id, user_id)
    
    try:
        while True:
            # 클라이언트로부터 메시지 수신
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "audio_data":
                # Base64로 인코딩된 오디오 데이터 처리
                await handle_audio_data(websocket, room_id, user_id, message)
            
            elif message_type == "text_input":
                # 직접 텍스트 입력 분석
                await handle_text_input(websocket, room_id, user_id, message)
            
            elif message_type == "ping":
                # 연결 상태 확인
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }))

            elif message_type == "face_image":
                await handle_face_image(websocket, room_id, user_id, message)
    
    except WebSocketDisconnect:
        print(f"사용자 {user_id}가 방 {room_id}에서 연결 해제됨")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket 오류: {e}")
        manager.disconnect(websocket)

async def handle_audio_data(websocket: WebSocket, room_id: str, user_id: str, message: dict):
    """오디오 데이터 처리"""
    
    try:
        # Base64 디코딩
        audio_base64 = message.get("audio_data", "")
        if not audio_base64:
            return
        
        audio_bytes = base64.b64decode(audio_base64)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # STT 처리
            transcript, confidence = speech_to_text(audio_bytes, language="ko-KR")
            
            if transcript.strip():
                # 텍스트 분석
                emotion_analysis = analyze_emotion_from_text(transcript)
                conflict_analysis = analyze_conflict_risk(transcript)
                suggestions = generate_feedback_suggestions(emotion_analysis, conflict_analysis, transcript)
                
                # 결과 전송
                response = {
                    "type": "speech_analysis_result",
                    "room_id": room_id,
                    "speaker_id": user_id,
                    "transcript": transcript.strip(),
                    "confidence": confidence,
                    "emotion_analysis": emotion_analysis,
                    "conflict_risk": conflict_analysis["risk_level"],
                    "suggestions": suggestions,
                    "processed_at": datetime.now().isoformat()
                }
                
                # 방의 모든 사용자에게 전송
                await manager.send_to_room(room_id, response)
                
                print(f"음성 분석 완료 - 방: {room_id}, 사용자: {user_id}, 텍스트: {transcript[:50]}...")
        
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except Exception as e:
        error_response = {
            "type": "error",
            "message": f"음성 처리 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_text(json.dumps(error_response))

async def handle_text_input(websocket: WebSocket, room_id: str, user_id: str, message: dict):
    """직접 텍스트 입력 분석"""
    
    try:
        text = message.get("text", "").strip()
        if not text:
            return
        
        # 텍스트 분석
        emotion_analysis = analyze_emotion_from_text(text)
        conflict_analysis = analyze_conflict_risk(text)
        suggestions = generate_feedback_suggestions(emotion_analysis, conflict_analysis, text)
        
        response = {
            "type": "text_analysis_result",
            "room_id": room_id,
            "speaker_id": user_id,
            "transcript": text,
            "confidence": 1.0,  # 직접 입력이므로 100% 확신
            "emotion_analysis": emotion_analysis,
            "conflict_risk": conflict_analysis["risk_level"],
            "suggestions": suggestions,
            "processed_at": datetime.now().isoformat()
        }
        
        # 방의 모든 사용자에게 전송
        await manager.send_to_room(room_id, response)
        
        print(f"텍스트 분석 완료 - 방: {room_id}, 사용자: {user_id}, 텍스트: {text[:50]}...")
    
    except Exception as e:
        error_response = {
            "type": "error",
            "message": f"텍스트 분석 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_text(json.dumps(error_response))

@router.get("/ws/rooms/{room_id}/status")
async def get_room_status(room_id: str):
    """방 상태 조회"""
    
    connection_count = len(manager.active_connections.get(room_id, set()))
    
    return {
        "room_id": room_id,
        "connected_users": connection_count,
        "is_active": connection_count > 0,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/rooms/{room_id}/broadcast-message")
async def broadcast_message_to_room(room_id: str, message: dict):
    """특정 방에 메시지 브로드캐스트"""
    
    if room_id in manager.active_connections:
        await manager.send_to_room(room_id, message)
        return {
            "success": True,
            "room_id": room_id,
            "message": "메시지가 전송되었습니다",
            "recipients": len(manager.active_connections[room_id])
        }
    else:
        return {
            "success": False,
            "room_id": room_id,
            "message": "활성 연결이 없습니다",
            "recipients": 0
        }
    
async def handle_face_image(websocket: WebSocket, room_id: str, user_id: str, message: dict):
    """표정 이미지 감정 분석"""
    try:
        image_base64 = message.get("image_data", "")
        if not image_base64:
            return

        # data:image/jpeg;base64, 접두사 제거
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        image_bytes = base64.b64decode(image_base64)
        
        # 감정 분석 
        emotion_result = detect_emotion_from_image(image_bytes)

        response = {
            "type": "face_analysis_result",
            "room_id": room_id,
            "speaker_id": user_id,
            "emotion": emotion_result,
            "processed_at": datetime.now().isoformat()
        }

        await manager.send_to_room(room_id, response)
        print(f"표정 분석 완료 - 방: {room_id}, 사용자: {user_id}, 감정: {emotion_result}")

    except Exception as e:
        error_response = {
            "type": "error",
            "message": f"표정 분석 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_text(json.dumps(error_response))