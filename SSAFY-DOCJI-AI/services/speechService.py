import speech_recognition as sr
import io
import tempfile
import os
import json
from datetime import datetime
from typing import Dict, List, Tuple
from .emotionService import EmotionService
from .conflictService import ConflictService
from .audioUtils import AudioUtils

class SpeechService:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 4000
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        self.recognizer.operation_timeout = None
        self.emotionService = EmotionService()
        self.conflictService = ConflictService()
    
    
    def speechToText(self, audioData: bytes, language: str = "ko-KR") -> Tuple[str, float]:
        """음성 데이터를 텍스트로 변환합니다."""
        wavData = AudioUtils.convertToWav(audioData, AudioUtils.detectAudioFormat("audio.webm"))
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tempFile:
            tempFile.write(wavData)
            tempFilePath = tempFile.name
        
        try:
            with sr.AudioFile(tempFilePath) as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.record(source)
            
            try:
                transcript = self.recognizer.recognize_google(audio, language=language)
                confidence = 0.8
                return transcript, confidence
                
            except sr.UnknownValueError:
                print("음성을 인식할 수 없습니다")
                return "", 0.0
                
            except sr.RequestError as e:
                print(f"Google Speech Recognition 오류: {e}")
                return "", 0.0
        
        finally:
            if os.path.exists(tempFilePath):
                os.unlink(tempFilePath)
    
    async def processAudio(self, audioData: bytes, speakerId: str, roomId: str, 
                          conversationContext: str = "[]") -> Dict:
        """음성 파일을 받아서 STT 변환 및 분석을 처리합니다."""
        try:
            context = json.loads(conversationContext) if conversationContext else []
        except json.JSONDecodeError:
            context = []
            print("컨텍스트 파싱 실패, 빈 배열로 처리")
        
        if len(audioData) == 0:
            raise ValueError("빈 오디오 파일입니다")
        
        # STT 처리
        transcript, confidence = self.speechToText(audioData, language="ko-KR")
        
        if not transcript.strip():
            return {
                "transcript": "",
                "confidence": 0.0,
                "emotionAnalysis": {
                    "emotion": "neutral", 
                    "confidence": 0.0, 
                    "intensity": 0.0, 
                    "detectedKeywords": []
                },
                "conflictRisk": "low",
                "suggestions": ["음성이 명확하지 않습니다. 다시 말씀해주세요."],
                "processedAt": datetime.now().isoformat()
            }
        
        # 텍스트 분석
        emotionAnalysis = self.emotionService.analyzeEmotion(transcript)
        conflictAnalysis = self.conflictService.analyzeConflictRisk(transcript, context)
        suggestions = self.conflictService.generateFeedbackSuggestions(
            emotionAnalysis, conflictAnalysis, transcript
        )
        
        return {
            "transcript": transcript.strip(),
            "confidence": confidence,
            "emotionAnalysis": emotionAnalysis,
            "conflictRisk": conflictAnalysis["riskLevel"],
            "suggestions": suggestions,
            "processedAt": datetime.now().isoformat()
        }
    
    async def processRealtimeChunk(self, audioData: bytes, speakerId: str, roomId: str, 
                                  chunkSequence: int = 0, isFinal: bool = False) -> Dict:
        """실시간 오디오 청크를 처리합니다."""
        if len(audioData) == 0:
            return {
                "partialTranscript": "",
                "chunkSequence": chunkSequence,
                "speakerId": speakerId,
                "roomId": roomId,
                "isFinal": isFinal,
                "processedAt": datetime.now().isoformat()
            }
        
        # 작은 청크는 간단한 STT만 수행
        transcript, confidence = self.speechToText(audioData, language="ko-KR")
        
        result = {
            "partialTranscript": transcript.strip(),
            "confidence": confidence,
            "chunkSequence": chunkSequence,
            "speakerId": speakerId,
            "roomId": roomId,
            "isFinal": isFinal,
            "processedAt": datetime.now().isoformat()
        }
        
        # 최종 청크인 경우 분석도 수행
        if isFinal and transcript.strip():
            emotionAnalysis = self.emotionService.analyzeEmotion(transcript)
            conflictAnalysis = self.conflictService.analyzeConflictRisk(transcript)
            
            result.update({
                "emotionAnalysis": emotionAnalysis,
                "conflictRisk": conflictAnalysis["riskLevel"],
                "suggestions": self.conflictService.generateFeedbackSuggestions(
                    emotionAnalysis, conflictAnalysis, transcript
                )
            })
        
        return result