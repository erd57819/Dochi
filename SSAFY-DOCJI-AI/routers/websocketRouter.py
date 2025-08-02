from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import base64
import tempfile
import os
from services.websocketService import WebsocketService
from services.speechService import SpeechService

router = APIRouter()
websocketService = WebsocketService()
speechService = SpeechService()

@router.websocket("/ws/speech-analysis/{roomId}/{userId}")
async def websocketSpeechAnalysis(websocket: WebSocket, roomId: str, userId: str):
    """실시간 음성 분석을 위한 WebSocket 엔드포인트입니다."""
    
    await websocketService.connect(websocket, roomId, userId)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            messageType = message.get("type")
            
            if messageType == "audio_data":
                await handleAudioData(websocket, roomId, userId, message)
            
            elif messageType == "text_input":
                await handleTextInput(websocket, roomId, userId, message)
            
            elif messageType == "ping":
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }))
    
    except WebSocketDisconnect:
        print(f"사용자 {userId}가 방 {roomId}에서 연결 해제됨")
        websocketService.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket 오류: {e}")
        websocketService.disconnect(websocket)

async def handleAudioData(websocket: WebSocket, roomId: str, userId: str, message: dict):
    """오디오 데이터를 처리합니다."""
    
    try:
        audioBase64 = message.get("audio_data", "")
        if not audioBase64:
            return
        
        audioBytes = base64.b64decode(audioBase64)
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tempFile:
            tempFile.write(audioBytes)
            tempFilePath = tempFile.name
        
        try:
            result = await speechService.processAudio(audioBytes, userId, roomId, "[]")
            
            if result["transcript"].strip():
                response = {
                    "type": "speech_analysis_result",
                    "roomId": roomId,
                    "speakerId": userId,
                    "transcript": result["transcript"],
                    "confidence": result["confidence"],
                    "emotionAnalysis": result["emotionAnalysis"],
                    "conflictRisk": result["conflictRisk"],
                    "suggestions": result["suggestions"],
                    "processedAt": result["processedAt"]
                }
                
                await websocketService.sendToRoom(roomId, response)
                
                print(f"음성 분석 완료 - 방: {roomId}, 사용자: {userId}, 텍스트: {result['transcript'][:50]}...")
        
        finally:
            if os.path.exists(tempFilePath):
                os.unlink(tempFilePath)
    
    except Exception as e:
        errorResponse = {
            "type": "error",
            "message": f"음성 처리 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_text(json.dumps(errorResponse))

async def handleTextInput(websocket: WebSocket, roomId: str, userId: str, message: dict):
    """직접 텍스트 입력을 분석합니다."""
    
    try:
        text = message.get("text", "").strip()
        if not text:
            return
        
        # 텍스트 분석 (speechService의 분석 로직 재사용)
        from services.emotionService import EmotionService
        from services.conflictService import ConflictService
        
        emotionService = EmotionService()
        conflictService = ConflictService()
        
        emotionAnalysis = emotionService.analyzeEmotion(text)
        conflictAnalysis = conflictService.analyzeConflictRisk(text)
        suggestions = conflictService.generateFeedbackSuggestions(emotionAnalysis, conflictAnalysis, text)
        
        response = {
            "type": "text_analysis_result",
            "roomId": roomId,
            "speakerId": userId,
            "transcript": text,
            "confidence": 1.0,
            "emotionAnalysis": emotionAnalysis,
            "conflictRisk": conflictAnalysis["riskLevel"],
            "suggestions": suggestions,
            "processedAt": datetime.now().isoformat()
        }
        
        await websocketService.sendToRoom(roomId, response)
        
        print(f"텍스트 분석 완료 - 방: {roomId}, 사용자: {userId}, 텍스트: {text[:50]}...")
    
    except Exception as e:
        errorResponse = {
            "type": "error",
            "message": f"텍스트 분석 오류: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_text(json.dumps(errorResponse))

@router.get("/ws/rooms/{roomId}/status")
async def getRoomStatus(roomId: str):
    """방 상태를 조회합니다."""
    return websocketService.getRoomStatus(roomId)

@router.post("/rooms/{roomId}/broadcast-message")
async def broadcastMessageToRoom(roomId: str, message: dict):
    """특정 방에 메시지를 브로드캐스트합니다."""
    return await websocketService.broadcastMessage(roomId, message)