import speech_recognition as sr
import tempfile
import os
from datetime import datetime
from typing import Tuple
from .audioUtils import AudioUtils

class VoiceService:
    def __init__(self):
        """음성 서비스를 초기화합니다."""
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 4000
        self.recognizer.dynamic_energy_threshold = True

    def speechToText(self, audioData: bytes, language: str = "ko-KR") -> Tuple[str, float]:
        """음성을 텍스트로 변환합니다."""
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
                confidence = 0.8  # recognize_google은 신뢰도를 직접 반환하지 않음
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

    def generateResponseText(self, transcript: str) -> str:
        """입력 텍스트에 대한 응답을 생성합니다."""
        transcriptLower = transcript.lower().strip()

        if any(word in transcriptLower for word in ["안녕", "hello", "hi", "하이"]):
            return "안녕하세요! 무엇을 도와드릴까요?"

        elif any(word in transcriptLower for word in ["날씨", "weather", "기온"]):
            return "오늘 날씨가 궁금하시군요. 날씨 정보를 확인해드릴게요."

        elif any(word in transcriptLower for word in ["뭐야", "뭔가요", "what", "무엇"]):
            return "더 구체적으로 질문해주시면 도움을 드릴 수 있습니다."

        elif any(word in transcriptLower for word in ["고마워", "감사", "thank"]):
            return "천만에요! 언제든지 도움이 필요하시면 말씀해주세요."

        else:
            return f"'{transcript}'라고 말씀하셨군요. 더 자세히 설명해주실 수 있나요?"

    async def processVoice(self, audioData: bytes, language: str = "ko-KR") -> dict:
        """음성 파일을 받아서 STT와 응답 생성을 처리합니다."""
        if len(audioData) == 0:
            raise ValueError("빈 오디오 파일입니다")

        # STT: 음성 → 텍스트
        transcript, confidence = self.speechToText(audioData, language)

        if not transcript.strip():
            return {
                "transcript": "",
                "confidence": 0.0,
                "responseText": "음성을 인식할 수 없습니다. 다시 말씀해주세요.",
                "processedAt": datetime.now().isoformat()
            }

        # 응답 텍스트 생성
        responseText = self.generateResponseText(transcript)

        return {
            "transcript": transcript.strip(),
            "confidence": confidence,
            "responseText": responseText,
            "processedAt": datetime.now().isoformat()
        }