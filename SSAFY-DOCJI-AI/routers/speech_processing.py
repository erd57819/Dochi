from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
import speech_recognition as sr
import io
import tempfile
import os
from datetime import datetime
import json
import asyncio
import wave
import audioop

router = APIRouter(prefix="/speech", tags=["speech_processing"])

class SpeechProcessingResponse(BaseModel):
    transcript: str
    confidence: float
    emotion_analysis: Dict
    conflict_risk: str
    suggestions: List[str]
    processed_at: str

# 음성 인식기 초기화
recognizer = sr.Recognizer()
recognizer.energy_threshold = 4000
recognizer.dynamic_energy_threshold = True
recognizer.pause_threshold = 0.8
recognizer.operation_timeout = None

def convert_audio_to_wav(audio_data: bytes, input_format: str = "webm") -> bytes:
    """오디오 데이터를 WAV 형식으로 변환"""
    try:
        # pydub를 사용하여 변환 (webm, mp3, m4a 등 지원)
        from pydub import AudioSegment
        
        # 입력 데이터를 AudioSegment로 로드
        if input_format.lower() in ["webm", "ogg"]:
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="ogg")
        elif input_format.lower() == "mp3":
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="mp3")
        elif input_format.lower() == "m4a":
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format="m4a")
        else:
            audio = AudioSegment.from_file(io.BytesIO(audio_data))
        
        # WAV로 변환 (16kHz, mono, 16bit)
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        
        # BytesIO로 WAV 데이터 출력
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        wav_buffer.seek(0)
        
        return wav_buffer.read()
    
    except Exception as e:
        print(f"오디오 변환 오류: {e}")
        return audio_data

def speech_to_text(audio_data: bytes, language: str = "ko-KR") -> tuple:
    """음성 데이터를 텍스트로 변환"""
    
    # WAV 형식으로 변환
    wav_data = convert_audio_to_wav(audio_data)
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
        temp_file.write(wav_data)
        temp_file_path = temp_file.name
    
    try:
        with sr.AudioFile(temp_file_path) as source:
            # 배경 소음 조정
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
            
            # Whisper 백업 시도 (OpenAI API 사용)
            try:
                import openai
                with open(temp_file_path, 'rb') as audio_file:
                    transcript_response = openai.Audio.transcribe(
                        model="whisper-1",
                        file=audio_file,
                        language="ko"
                    )
                    return transcript_response.text, 0.9
            except Exception as whisper_error:
                print(f"Whisper 오류: {whisper_error}")
                return "", 0.0
    
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

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
        "detected_keywords": detected_keywords[:3]  # 최대 3개
    }

def analyze_conflict_risk(text: str, context: List[Dict] = None) -> Dict:
    """갈등 위험도 분석"""
    
    # 갈등 지표 키워드
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
    question_count = text.count('?')
    
    if exclamation_count >= 3:
        conflict_score += 1.5
        indicators_found.append("과도한 강조 (!!!)")
    elif exclamation_count >= 2:
        conflict_score += 0.8
        indicators_found.append("강한 어조 (!!)")
    
    if question_count >= 2:
        conflict_score += 0.5
        indicators_found.append("의문 표현")
    
    # 문장 길이 및 반복 패턴
    if len(text) > 100 and conflict_score > 0:
        conflict_score += 0.5
        indicators_found.append("긴 발화")
    
    # 컨텍스트 분석 (이전 대화 패턴)
    if context and len(context) > 1:
        recent_negative = 0
        for msg in context[-3:]:  # 최근 3개 메시지
            msg_text = msg.get('text', '').lower()
            for indicator in high_conflict_indicators + medium_conflict_indicators:
                if indicator in msg_text:
                    recent_negative += 1
                    break
        
        if recent_negative >= 2:
            conflict_score += 1.0
            indicators_found.append("연속된 부정적 패턴")
    
    # 최종 점수 조정
    conflict_score = max(0.0, conflict_score)
    
    # 위험도 레벨 결정
    if conflict_score >= 4.0:
        risk_level = "high"
    elif conflict_score >= 2.0:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    risk_score = min(1.0, conflict_score / 5.0)
    
    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "indicators": indicators_found,
        "raw_score": conflict_score
    }

def generate_feedback_suggestions(emotion_analysis: Dict, conflict_analysis: Dict, text: str) -> List[str]:
    """분석 결과 기반 피드백 제안 생성"""
    
    suggestions = []
    emotion = emotion_analysis.get("emotion", "neutral")
    risk_level = conflict_analysis.get("risk_level", "low")
    risk_score = conflict_analysis.get("risk_score", 0.0)
    
    # 갈등 위험도 기반 제안
    if risk_level == "high":
        suggestions.extend([
            "대화 톤이 공격적으로 감지됩니다. 잠시 심호흡을 하고 차분하게 이야기해보세요.",
            "구체적인 사실에 집중하여 감정적인 표현보다는 객관적으로 말씀해보세요.",
            "상대방의 입장에서 생각해보고, '나는 ~라고 느낀다'는 식으로 표현해보세요.",
            "'잠깐, 우리 대화를 정리해볼까요?'라고 제안해보세요."
        ])
    elif risk_level == "medium":
        suggestions.extend([
            "대화에 약간의 긴장감이 감지됩니다. 좀 더 부드러운 어조로 이야기해보세요.",
            "상대방의 의견을 먼저 충분히 들어보신 후 본인의 생각을 말씀해보세요.",
            "구체적인 예시나 상황을 들어서 설명하면 더 잘 전달될 것 같습니다."
        ])
    
    # 감정 상태 기반 제안
    if emotion == "angry" or emotion == "frustrated":
        suggestions.extend([
            "화가 나는 것은 자연스러운 감정입니다. 감정을 인정하되 표현 방식을 조절해보세요.",
            "'지금 제가 화가 나는 이유는...' 이라고 시작해보세요."
        ])
    elif emotion == "sad":
        suggestions.extend([
            "힘든 감정이 느껴집니다. 솔직하게 어떤 부분이 속상한지 말씀해보세요.",
            "상대방에게 위로나 이해를 구해보는 것도 좋겠습니다."
        ])
    elif emotion == "anxious":
        suggestions.extend([
            "불안한 마음이 느껴집니다. 걱정되는 부분을 구체적으로 이야기해보세요.",
            "상대방에게 확신이나 안심을 구해보세요."
        ])
    elif emotion == "happy" or emotion == "positive":
        suggestions.extend([
            "긍정적인 대화 분위기를 잘 만들어가고 계십니다!",
            "이러한 좋은 분위기를 계속 유지해보세요."
        ])
    
    # 일반적인 대화 개선 제안
    if len(text.split()) < 5:
        suggestions.append("좀 더 자세하고 구체적으로 설명해보세요.")
    
    if "?" not in text and risk_level == "low":
        suggestions.append("상대방의 의견이나 생각도 물어보세요.")
    
    # 중복 제거 및 최대 4개로 제한
    unique_suggestions = list(dict.fromkeys(suggestions))
    return unique_suggestions[:4]

@router.post("/process-audio", response_model=SpeechProcessingResponse)
async def process_audio(
    audio_file: UploadFile = File(...),
    speaker_id: str = Form(...),
    room_id: str = Form(...),
    conversation_context: str = Form(default="[]")
):
    """
    음성 파일을 받아서 STT 변환 및 분석 처리
    - WebRTC에서 전송된 오디오 데이터를 처리
    - 텍스트 변환 후 감정/갈등 분석
    - 실시간 피드백 제공
    """
    
    if not audio_file.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다. 지원 형식: wav, mp3, webm, ogg, m4a"
        )
    
    try:
        # 컨텍스트 파싱
        try:
            context = json.loads(conversation_context) if conversation_context else []
        except json.JSONDecodeError:
            context = []
            print("컨텍스트 파싱 실패, 빈 배열로 처리")
        
        # 오디오 파일 읽기
        audio_content = await audio_file.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="빈 오디오 파일입니다")
        
        print(f"오디오 파일 수신: {len(audio_content)} bytes, 타입: {audio_file.content_type}")
        
        # STT 처리
        transcript, confidence = speech_to_text(audio_content, language="ko-KR")
        
        if not transcript.strip():
            return SpeechProcessingResponse(
                transcript="",
                confidence=0.0,
                emotion_analysis={"emotion": "neutral", "confidence": 0.0, "intensity": 0.0, "detected_keywords": []},
                conflict_risk="low",
                suggestions=["음성이 명확하지 않습니다. 다시 말씀해주세요."],
                processed_at=datetime.now().isoformat()
            )
        
        print(f"STT 결과: {transcript} (confidence: {confidence})")
        
        # 텍스트 분석
        emotion_analysis = analyze_emotion_from_text(transcript)
        conflict_analysis = analyze_conflict_risk(transcript, context)
        suggestions = generate_feedback_suggestions(emotion_analysis, conflict_analysis, transcript)
        
        print(f"분석 결과 - 감정: {emotion_analysis['emotion']}, 갈등위험: {conflict_analysis['risk_level']}")
        
        return SpeechProcessingResponse(
            transcript=transcript.strip(),
            confidence=confidence,
            emotion_analysis=emotion_analysis,
            conflict_risk=conflict_analysis["risk_level"],
            suggestions=suggestions,
            processed_at=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"음성 처리 중 예상치 못한 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/process-realtime-chunk")
async def process_realtime_chunk(
    audio_chunk: UploadFile = File(...),
    speaker_id: str = Form(...),
    room_id: str = Form(...),
    chunk_sequence: int = Form(default=0),
    is_final: bool = Form(default=False)
):
    """
    실시간 오디오 청크 처리 (WebRTC 스트림용)
    """
    
    try:
        audio_content = await audio_chunk.read()
        
        if len(audio_content) == 0:
            return {
                "partial_transcript": "",
                "chunk_sequence": chunk_sequence,
                "speaker_id": speaker_id,
                "room_id": room_id,
                "is_final": is_final,
                "processed_at": datetime.now().isoformat()
            }
        
        # 작은 청크는 간단한 STT만 수행
        transcript, confidence = speech_to_text(audio_content, language="ko-KR")
        
        result = {
            "partial_transcript": transcript.strip(),
            "confidence": confidence,
            "chunk_sequence": chunk_sequence,
            "speaker_id": speaker_id,
            "room_id": room_id,
            "is_final": is_final,
            "processed_at": datetime.now().isoformat()
        }
        
        # 최종 청크인 경우 분석도 수행
        if is_final and transcript.strip():
            emotion_analysis = analyze_emotion_from_text(transcript)
            conflict_analysis = analyze_conflict_risk(transcript)
            
            result.update({
                "emotion_analysis": emotion_analysis,
                "conflict_risk": conflict_analysis["risk_level"],
                "suggestions": generate_feedback_suggestions(emotion_analysis, conflict_analysis, transcript)
            })
        
        return result
    
    except Exception as e:
        print(f"실시간 청크 처리 오류: {e}")
        return {
            "error": str(e),
            "chunk_sequence": chunk_sequence,
            "speaker_id": speaker_id,
            "room_id": room_id,
            "processed_at": datetime.now().isoformat()
        }

@router.get("/health")
async def health_check():
    """음성 처리 서비스 상태 확인"""
    return {
        "status": "healthy",
        "service": "speech-processing",
        "version": "1.0.0",
        "features": {
            "speech_to_text": "Google Speech Recognition + Whisper 백업",
            "emotion_analysis": "키워드 기반 감정 분석",
            "conflict_detection": "다층 갈등 위험도 분석",
            "realtime_processing": "실시간 오디오 청크 처리",
            "feedback_generation": "상황별 대화 개선 제안"
        },
        "supported_formats": ["wav", "mp3", "webm", "ogg", "m4a"],
        "languages": ["ko-KR", "en-US"],
        "timestamp": datetime.now().isoformat()
    }