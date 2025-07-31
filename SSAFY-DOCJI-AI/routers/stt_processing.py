from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import requests
import tempfile
import json
from datetime import datetime
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

router = APIRouter(prefix="/stt", tags=["speech_to_text"])

class STTResponse(BaseModel):
    transcript: str
    processing_time: float
    model: str
    processed_at: str

class STTAnalysisResponse(BaseModel):
    transcript: str
    processing_time: float
    model: str
    emotion_analysis: Optional[Dict] = None
    conflict_risk: Optional[str] = None
    suggestions: Optional[List[str]] = None
    processed_at: str

# GMS API 설정
GMS_KEY = os.getenv("GMS_KEY")
GMS_API_URL = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions"

if not GMS_KEY:
    raise ValueError("GMS_KEY environment variable is required")

def whisper_stt(audio_file_path: str, model: str = "whisper-1") -> tuple:
    """
    GMS API를 사용하여 Whisper-1 모델로 STT 처리
    """
    
    try:
        # 헤더 설정
        headers = {
            "Authorization": f"Bearer {GMS_KEY}"
        }
        
        # 파일과 모델 파라미터 준비
        with open(audio_file_path, 'rb') as audio_file:
            files = {
                'file': ('audio.mp3', audio_file, 'audio/mpeg'),
                'model': (None, model)
            }
            
            # GMS API 호출
            response = requests.post(
                GMS_API_URL,
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

def convert_to_supported_format(audio_data: bytes, input_filename: str) -> bytes:
    """
    오디오 데이터를 Whisper가 지원하는 형식으로 변환
    """
    
    try:
        from pydub import AudioSegment
        import io
        
        # 파일 확장자에 따른 형식 감지
        if input_filename.lower().endswith(('.webm', '.ogg')):
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="ogg")
        elif input_filename.lower().endswith('.mp4'):
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="mp4")
        elif input_filename.lower().endswith('.wav'):
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="wav")
        elif input_filename.lower().endswith('.mp3'):
            return audio_data  # 이미 MP3 형식
        else:
            # 기본적으로 webm으로 시도
            audio = AudioSegment.from_file(io.BytesIO(audio_data))
        
        # MP3로 변환
        mp3_buffer = io.BytesIO()
        audio.export(mp3_buffer, format="mp3", bitrate="128k")
        mp3_buffer.seek(0)
        
        return mp3_buffer.read()
        
    except Exception as e:
        print(f"오디오 변환 오류: {e}")
        return audio_data

def analyze_emotion_from_text(text: str) -> Dict:
    """텍스트에서 감정을 분석"""
    
    emotion_keywords = {
        "angry": ["화나", "짜증", "열받", "빡쳐", "싫어", "미워", "화가", "분노"],
        "sad": ["슬프", "우울", "힘들", "속상", "아프", "눈물", "슬퍼", "절망"],
        "happy": ["기뻐", "좋아", "행복", "즐거", "신나", "웃음", "기분좋", "만족"],
        "anxious": ["걱정", "불안", "두려", "무서", "긴장", "떨려", "조심"],
        "frustrated": ["답답", "막막", "곤란", "어렵", "복잡", "헷갈", "골치"],
        "positive": ["감사", "고마워", "훌륭", "멋져", "완벽", "최고", "잘했", "대단"]
    }
    
    text_lower = text.lower().replace(" ", "")
    emotion_scores = {}
    detected_keywords = []
    
    for emotion, keywords in emotion_keywords.items():
        score = 0
        emotion_keywords_found = []
        
        for keyword in keywords:
            if keyword in text_lower:
                score += 1
                emotion_keywords_found.append(keyword)
        
        if score > 0:
            emotion_scores[emotion] = score
            detected_keywords.extend(emotion_keywords_found)
    
    if not emotion_scores:
        return {
            "emotion": "neutral",
            "confidence": 0.5,
            "intensity": 0.3,
            "detected_keywords": []
        }
    
    # 가장 높은 점수의 감정 선택
    dominant_emotion = max(emotion_scores, key=emotion_scores.get)
    max_score = emotion_scores[dominant_emotion]
    confidence = min(0.95, 0.6 + (max_score * 0.15))
    intensity = min(1.0, max_score * 0.25 + 0.3)
    
    return {
        "emotion": dominant_emotion,
        "confidence": confidence,
        "intensity": intensity,
        "detected_keywords": detected_keywords[:3]
    }

def analyze_conflict_risk(text: str) -> Dict:
    """갈등 위험도 분석"""
    
    high_conflict_indicators = [
        "잘못", "문제", "틀렸", "이상해", "말도 안", "어이없", "웃기", 
        "진짜로", "심각", "화나", "짜증", "못참", "한심", "바보"
    ]
    
    medium_conflict_indicators = [
        "왜 그래", "뭔데", "이해 안", "모르겠", "답답", "힘들", 
        "곤란", "어렵", "복잡", "애매"
    ]
    
    positive_indicators = [
        "좋아", "맞아", "그래", "이해", "동의", "괜찮", "고마워", 
        "미안", "죄송", "알겠", "그렇구나", "맞네"
    ]
    
    text_lower = text.lower().replace(" ", "")
    conflict_score = 0.0
    indicators_found = []
    
    # 고위험 지표 확인
    for indicator in high_conflict_indicators:
        if indicator in text_lower:
            conflict_score += 2.0
            indicators_found.append(f"고위험: {indicator}")
    
    # 중위험 지표 확인
    for indicator in medium_conflict_indicators:
        if indicator in text_lower:
            conflict_score += 1.0
            indicators_found.append(f"중위험: {indicator}")
    
    # 긍정적 지표로 점수 감소
    positive_count = 0
    for positive in positive_indicators:
        if positive in text_lower:
            positive_count += 1
    
    if positive_count > 0:
        conflict_score -= (positive_count * 0.8)
        indicators_found.append(f"긍정적 표현 {positive_count}개")
    
    # 어조 분석
    exclamation_count = text.count('!')
    if exclamation_count >= 3:
        conflict_score += 1.5
        indicators_found.append("과도한 강조 (!!!)")
    elif exclamation_count >= 2:
        conflict_score += 0.8
        indicators_found.append("강한 어조 (!!)")
    
    # 최종 점수 조정
    conflict_score = max(0.0, conflict_score)
    
    # 위험도 레벨 결정
    if conflict_score >= 4.0:
        risk_level = "high"
    elif conflict_score >= 2.0:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    return {
        "risk_level": risk_level,
        "risk_score": min(1.0, conflict_score / 5.0),
        "indicators": indicators_found,
        "raw_score": conflict_score
    }

def generate_feedback_suggestions(emotion_analysis: Dict, conflict_analysis: Dict, text: str) -> List[str]:
    """분석 결과 기반 피드백 제안 생성"""
    
    suggestions = []
    emotion = emotion_analysis.get("emotion", "neutral")
    risk_level = conflict_analysis.get("risk_level", "low")
    
    if risk_level == "high":
        suggestions.extend([
            "대화 톤이 공격적으로 감지됩니다. 차분하게 이야기해보세요.",
            "구체적인 사실에 집중하여 객관적으로 말씀해보세요.",
            "상대방의 입장에서 생각해보시는 것이 어떨까요?",
            "잠시 휴식을 취하고 대화를 재개해보세요."
        ])
    elif risk_level == "medium":
        suggestions.extend([
            "대화에 약간의 긴장감이 감지됩니다. 부드러운 어조로 이야기해보세요.",
            "상대방의 의견을 먼저 충분히 들어보신 후 말씀해보세요.",
            "구체적인 예시를 들어서 설명하면 더 잘 전달될 것 같습니다."
        ])
    
    if emotion == "angry" or emotion == "frustrated":
        suggestions.extend([
            "화가 나는 감정이 느껴집니다. 감정을 인정하되 표현 방식을 조절해보세요.",
            "'지금 제가 화가 나는 이유는...' 이라고 시작해보세요."
        ])
    elif emotion == "sad":
        suggestions.extend([
            "힘든 감정이 느껴집니다. 솔직하게 어떤 부분이 속상한지 말씀해보세요."
        ])
    elif emotion == "happy" or emotion == "positive":
        suggestions.extend([
            "긍정적인 대화 분위기를 잘 만들어가고 계십니다!",
            "이러한 좋은 분위기를 계속 유지해보세요."
        ])
    
    # 중복 제거 및 최대 4개로 제한
    unique_suggestions = list(dict.fromkeys(suggestions))
    return unique_suggestions[:4]

@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    model: str = Form(default="whisper-1")
):
    """
    오디오 파일을 받아서 GMS API (Whisper-1)로 텍스트 변환
    """
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다. 지원 형식: mp3, wav, webm, ogg, mp4"
        )
    
    start_time = datetime.now()
    
    try:
        # 오디오 파일 읽기
        audio_content = await audio_file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="빈 오디오 파일입니다")
        
        print(f"오디오 파일 수신: {len(audio_content)} bytes, 타입: {audio_file.content_type}")
        
        # 오디오 형식 변환 (필요시)
        converted_audio = convert_to_supported_format(audio_content, audio_file.filename or "audio.webm")
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_file.write(converted_audio)
            temp_file_path = temp_file.name
        
        try:
            # Whisper STT 처리
            transcript, success = whisper_stt(temp_file_path, model)
            
            if not success or not transcript:
                raise HTTPException(
                    status_code=422, 
                    detail="음성을 인식할 수 없습니다. 더 명확하게 말씀해주세요."
                )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            print(f"STT 완료: {transcript} (처리시간: {processing_time:.2f}초)")
            
            return STTResponse(
                transcript=transcript,
                processing_time=processing_time,
                model=model,
                processed_at=datetime.now().isoformat()
            )
        
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"STT 처리 중 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/transcribe-and-analyze", response_model=STTAnalysisResponse)
async def transcribe_and_analyze(
    audio_file: UploadFile = File(...),
    model: str = Form(default="whisper-1"),
    analyze_emotion: bool = Form(default=True),
    analyze_conflict: bool = Form(default=True)
):
    """
    오디오 파일을 텍스트로 변환하고 감정/갈등 분석 수행
    """
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다"
        )
    
    start_time = datetime.now()
    
    try:
        # 오디오 파일 읽기
        audio_content = await audio_file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="빈 오디오 파일입니다")
        
        # 오디오 형식 변환
        converted_audio = convert_to_supported_format(audio_content, audio_file.filename or "audio.webm")
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            temp_file.write(converted_audio)
            temp_file_path = temp_file.name
        
        try:
            # Whisper STT 처리
            transcript, success = whisper_stt(temp_file_path, model)
            
            if not success or not transcript:
                raise HTTPException(
                    status_code=422, 
                    detail="음성을 인식할 수 없습니다"
                )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # 분석 수행
            emotion_analysis = None
            conflict_analysis = None
            suggestions = None
            
            if analyze_emotion:
                emotion_analysis = analyze_emotion_from_text(transcript)
            
            if analyze_conflict:
                conflict_analysis = analyze_conflict_risk(transcript)
            
            if emotion_analysis and conflict_analysis:
                suggestions = generate_feedback_suggestions(emotion_analysis, conflict_analysis, transcript)
            
            return STTAnalysisResponse(
                transcript=transcript,
                processing_time=processing_time,
                model=model,
                emotion_analysis=emotion_analysis,
                conflict_risk=conflict_analysis.get("risk_level") if conflict_analysis else None,
                suggestions=suggestions,
                processed_at=datetime.now().isoformat()
            )
        
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"STT 분석 처리 중 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 분석 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """STT 서비스 상태 확인"""
    
    # GMS API 연결 테스트
    gms_status = "connected" if GMS_KEY else "no_key"
    
    return {
        "status": "healthy",
        "service": "speech-to-text",
        "version": "2.0.0",
        "gms_api": {
            "status": gms_status,
            "url": GMS_API_URL,
            "model": "whisper-1"
        },
        "features": {
            "speech_to_text": "GMS API (Whisper-1)",
            "emotion_analysis": "키워드 기반 감정 분석",
            "conflict_detection": "다층 갈등 위험도 분석",
            "feedback_generation": "상황별 대화 개선 제안"
        },
        "supported_formats": ["mp3", "wav", "webm", "ogg", "mp4"],
        "max_file_size": "25MB",
        "timestamp": datetime.now().isoformat()
    }