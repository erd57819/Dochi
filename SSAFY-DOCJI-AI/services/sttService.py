import os
import requests
import tempfile
import json
from datetime import datetime
from typing import Dict, List, Tuple
from .emotionService import EmotionService
from .conflictService import ConflictService
from .audioUtils import AudioUtils

class SttService:
    def __init__(self):
        self.gmsKey = os.getenv("GMS_KEY")
        self.gmsApiUrl = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions"
        self.emotionService = EmotionService()
        self.conflictService = ConflictService()
        
        if not self.gmsKey:
            print("Warning: GMS_KEY environment variable not found")
    
    
    def whisperStt(self, audioFilePath: str, model: str = "whisper-1") -> Tuple[str, bool]:
        """GMS API를 사용하여 Whisper-1 모델로 STT 처리합니다."""
        try:
            headers = {
                "Authorization": f"Bearer {self.gmsKey}"
            }
            
            with open(audioFilePath, 'rb') as audioFile:
                files = {
                    'file': ('audio.mp3', audioFile, 'audio/mpeg'),
                    'model': (None, model)
                }
                
                response = requests.post(
                    self.gmsApiUrl,
                    headers=headers,
                    files=files,
                    timeout=30
                )
            
            if response.status_code == 200:
                result = response.json()
                transcript = result.get('text', '').strip()
                return transcript, True
            else:
                print(f"GMS API 오류: {response.status_code} - {response.text}")
                return "", False
                
        except requests.exceptions.Timeout:
            print("GMS API 타임아웃")
            return "", False
        except requests.exceptions.RequestException as e:
            print(f"GMS API 요청 오류: {e}")
            return "", False
        except Exception as e:
            print(f"Whisper STT 처리 오류: {e}")
            return "", False
    
    async def processAudio(self, audioData: bytes, filename: str, model: str = "whisper-1") -> Dict:
        """오디오 데이터를 처리하여 STT 결과를 반환합니다."""
        startTime = datetime.now()
        
        if len(audioData) == 0:
            raise ValueError("빈 오디오 파일입니다")
        
        # 오디오 형식 변환
        convertedAudio = AudioUtils.convertToMp3(audioData, filename)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tempFile:
            tempFile.write(convertedAudio)
            tempFilePath = tempFile.name
        
        try:
            # Whisper STT 처리
            transcript, success = self.whisperStt(tempFilePath, model)
            
            if not success or not transcript:
                raise ValueError("음성을 인식할 수 없습니다. 더 명확하게 말씀해주세요.")
            
            processingTime = (datetime.now() - startTime).total_seconds()
            
            return {
                "transcript": transcript,
                "processingTime": processingTime,
                "model": model,
                "processedAt": datetime.now().isoformat()
            }
        
        finally:
            if os.path.exists(tempFilePath):
                os.unlink(tempFilePath)
    
    async def processAudioWithAnalysis(self, audioData: bytes, filename: str, model: str = "whisper-1", 
                                     analyzeEmotion: bool = True, analyzeConflict: bool = True) -> Dict:
        """오디오 데이터를 처리하여 STT 변환 및 감정/갈등 분석을 수행합니다."""
        # 기본 STT 처리
        sttResult = await self.processAudio(audioData, filename, model)
        transcript = sttResult["transcript"]
        
        # 분석 수행
        emotionAnalysis = None
        conflictAnalysis = None
        suggestions = None
        
        if analyzeEmotion:
            emotionAnalysis = self.emotionService.analyzeEmotion(transcript)
        
        if analyzeConflict:
            conflictAnalysis = self.conflictService.analyzeConflictRisk(transcript)
        
        if emotionAnalysis and conflictAnalysis:
            suggestions = self.conflictService.generateFeedbackSuggestions(
                emotionAnalysis, conflictAnalysis, transcript
            )
        
        return {
            **sttResult,
            "emotionAnalysis": emotionAnalysis,
            "conflictRisk": conflictAnalysis.get("riskLevel") if conflictAnalysis else None,
            "suggestions": suggestions
        }