from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import speech_recognition as sr
import pyttsx3
import io
import tempfile
import os
from datetime import datetime
import json
import asyncio
import threading
import wave
from gtts import gTTS
import pygame
import base64

router = APIRouter(prefix="/voice", tags=["voice_processing"])

class VoiceProcessingRequest(BaseModel):
    text: str
    language: str = "ko"
    speed: float = 1.0
    voice_type: str = "female"  # male, female

class VoiceProcessingResponse(BaseModel):
    transcript: str
    confidence: float
    response_text: str
    audio_base64: str
    processed_at: str

class TTSRequest(BaseModel):
    text: str
    language: str = "ko"
    speed: float = 1.0
    voice_type: str = "female"

# 음성 인식기 초기화
recognizer = sr.Recognizer()
recognizer.energy_threshold = 4000
recognizer.dynamic_energy_threshold = True

# TTS 엔진 초기화
tts_engine = pyttsx3.init()

def setup_tts_engine(speed: float = 1.0, voice_type: str = "female"):
    """TTS 엔진 설정"""
    global tts_engine
    
    # 속도 설정
    tts_engine.setProperty('rate', int(200 * speed))
    
    # 볼륨 설정
    tts_engine.setProperty('volume', 0.9)
    
    # 음성 설정
    voices = tts_engine.getProperty('voices')
    if voices:
        if voice_type == "female" and len(voices) > 1:
            tts_engine.setProperty('voice', voices[1].id)
        else:
            tts_engine.setProperty('voice', voices[0].id)

def speech_to_text(audio_data: bytes, language: str = "ko-KR") -> tuple:
    """음성을 텍스트로 변환"""
    
    # 오디오 데이터를 WAV 형식으로 변환
    from pydub import AudioSegment
    
    try:
        # 입력 데이터를 AudioSegment로 로드
        audio = AudioSegment.from_file(io.BytesIO(audio_data))
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        
        # WAV로 변환
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)
        wav_data = wav_buffer.read()
        
    except Exception as e:
        print(f"오디오 변환 오류: {e}")
        wav_data = audio_data

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(wav_data)
        temp_file_path = temp_file.name
    
    try:
        with sr.AudioFile(temp_file_path) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.record(source)
        
        # Google Speech Recognition 사용
        try:
            transcript = recognizer.recognize_google(audio, language=language)
            confidence = 0.8
            return transcript, confidence
            
        except sr.UnknownValueError:
            print("음성을 인식할 수 없습니다")
            return "", 0.0
            
        except sr.RequestError as e:
            print(f"Google Speech Recognition 오류: {e}")
            return "", 0.0
    
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

def text_to_speech_gtts(text: str, language: str = "ko") -> bytes:
    """Google TTS를 사용하여 텍스트를 음성으로 변환"""
    
    try:
        # gTTS를 사용하여 음성 생성
        tts = gTTS(text=text, lang=language, slow=False)
        
        # 메모리 버퍼에 저장
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.read()
    
    except Exception as e:
        print(f"TTS 생성 오류: {e}")
        return b""

def text_to_speech_pyttsx3(text: str, speed: float = 1.0, voice_type: str = "female") -> bytes:
    """pyttsx3를 사용하여 텍스트를 음성으로 변환"""
    
    try:
        setup_tts_engine(speed, voice_type)
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file_path = temp_file.name
        
        # 음성 생성 및 저장
        tts_engine.save_to_file(text, temp_file_path)
        tts_engine.runAndWait()
        
        # 파일 읽기
        with open(temp_file_path, 'rb') as audio_file:
            audio_data = audio_file.read()
        
        # 임시 파일 삭제
        os.unlink(temp_file_path)
        
        return audio_data
    
    except Exception as e:
        print(f"pyttsx3 TTS 오류: {e}")
        return b""

def generate_response_text(transcript: str) -> str:
    """입력 텍스트에 대한 응답 생성 (간단한 챗봇 로직)"""
    
    transcript_lower = transcript.lower().strip()
    
    # 인사
    if any(word in transcript_lower for word in ["안녕", "hello", "hi", "하이"]):
        return "안녕하세요! 무엇을 도와드릴까요?"
    
    # 날씨 관련
    elif any(word in transcript_lower for word in ["날씨", "weather", "기온"]):
        return "오늘 날씨가 궁금하시군요. 날씨 정보를 확인해드릴게요."
    
    # 질문
    elif any(word in transcript_lower for word in ["뭐야", "뭔가요", "what", "무엇"]):
        return "더 구체적으로 질문해주시면 도움을 드릴 수 있습니다."
    
    # 감사 인사
    elif any(word in transcript_lower for word in ["고마워", "감사", "thank"]):
        return "천만에요! 언제든지 도움이 필요하시면 말씀해주세요."
    
    # 기본 응답
    else:
        return f"'{transcript}'라고 말씀하셨군요. 더 자세히 설명해주실 수 있나요?"

@router.post("/process-voice", response_model=VoiceProcessingResponse)
async def process_voice(
    audio_file: UploadFile = File(...),
    language: str = Form(default="ko-KR"),
    tts_language: str = Form(default="ko"),
    speed: float = Form(default=1.0),
    voice_type: str = Form(default="female")
):
    """
    음성 파일을 받아서 STT -> 응답 생성 -> TTS 처리
    """
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다"
        )
    
    try:
        # 오디오 파일 읽기
        audio_content = await audio_file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="빈 오디오 파일입니다")
        
        print(f"음성 파일 수신: {len(audio_content)} bytes")
        
        # 1. STT: 음성 → 텍스트
        transcript, confidence = speech_to_text(audio_content, language)
        
        if not transcript.strip():
            return VoiceProcessingResponse(
                transcript="",
                confidence=0.0,
                response_text="음성을 인식할 수 없습니다. 다시 말씀해주세요.",
                audio_base64="",
                processed_at=datetime.now().isoformat()
            )
        
        print(f"STT 결과: {transcript}")
        
        # 2. 응답 텍스트 생성
        response_text = generate_response_text(transcript)
        print(f"응답 텍스트: {response_text}")
        
        # 3. TTS: 응답 텍스트 → 음성
        audio_data = text_to_speech_gtts(response_text, tts_language)
        
        if not audio_data:
            # gTTS 실패 시 pyttsx3 시도
            audio_data = text_to_speech_pyttsx3(response_text, speed, voice_type)
        
        # 4. 오디오를 Base64로 인코딩
        audio_base64 = base64.b64encode(audio_data).decode('utf-8') if audio_data else ""
        
        return VoiceProcessingResponse(
            transcript=transcript.strip(),
            confidence=confidence,
            response_text=response_text,
            audio_base64=audio_base64,
            processed_at=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"음성 처리 중 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    """
    텍스트를 음성으로 변환하여 오디오 파일 반환
    """
    
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="변환할 텍스트가 없습니다")
        
        print(f"TTS 요청: {request.text}")
        
        # TTS 처리
        audio_data = text_to_speech_gtts(request.text, request.language)
        
        if not audio_data:
            audio_data = text_to_speech_pyttsx3(request.text, request.speed, request.voice_type)
        
        if not audio_data:
            raise HTTPException(status_code=500, detail="음성 생성에 실패했습니다")
        
        # 오디오 스트림으로 반환
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mp3",
            headers={
                "Content-Disposition": "attachment; filename=tts_output.mp3"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"TTS 처리 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"TTS 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/speech-to-text")
async def speech_to_text_only(
    audio_file: UploadFile = File(...),
    language: str = Form(default="ko-KR")
):
    """
    음성 파일을 텍스트로만 변환
    """
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="오디오 파일만 업로드 가능합니다")
    
    try:
        audio_content = await audio_file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="빈 오디오 파일입니다")
        
        transcript, confidence = speech_to_text(audio_content, language)
        
        return {
            "transcript": transcript.strip(),
            "confidence": confidence,
            "processed_at": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"STT 처리 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"STT 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """음성 처리 서비스 상태 확인"""
    return {
        "status": "healthy",
        "service": "voice-processing",
        "version": "1.0.0",
        "features": {
            "speech_to_text": "Google Speech Recognition",
            "text_to_speech": "Google TTS + pyttsx3",
            "voice_chat": "STT + Response Generation + TTS",
            "languages": ["ko-KR", "en-US"],
            "audio_formats": ["wav", "mp3", "webm", "ogg", "m4a"]
        },
        "timestamp": datetime.now().isoformat()
    }