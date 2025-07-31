# 음성인식 TTS 시스템 사용 가이드

## 🎯 프로젝트 개요

참견도치 프로젝트에 음성인식(STT)과 음성합성(TTS) 시스템을 통합하여 사용자가 음성으로 AI와 대화할 수 있는 기능을 구현했습니다.

## 🏗️ 시스템 구조

```
프론트엔드 (React)
├── useVoiceProcessing.js (음성 처리 훅)
├── VoiceChat.jsx (음성 채팅 컴포넌트)
├── VideoCallWithVoice.jsx (화상통화 + 음성 AI)
└── Pages (라우팅 페이지들)

백엔드 (FastAPI AI 서버)
├── voice_processing.py (음성 처리 API)
├── STT (Google Speech Recognition)
├── TTS (Google TTS + pyttsx3)
└── 간단한 챗봇 응답 로직
```

## 🚀 실행 방법

### 1. AI 서버 실행

```bash
cd SSAFY-DOCJI-AI

# 패키지 설치
pip install -r requirements.txt

# 서버 시작
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 프론트엔드 실행

```bash
cd SSAFY-DOCHI-FE

# 개발 서버 시작
npm run dev
```

### 3. 접속 URL

- **음성 채팅 페이지**: http://localhost:5173/voice-chat
- **화상 통화 + 음성 AI**: http://localhost:5173/video-room/room123
- **API 문서**: http://localhost:8000/docs

## 🎤 기능 설명

### 1. 독립 음성 채팅 (`/voice-chat`)

**기능:**
- 🎤 음성 녹음 → STT → AI 응답 생성 → TTS 재생
- ✏️ 텍스트 입력 → TTS 음성 재생
- 💬 대화 기록 표시
- 🔊 이전 응답 다시 듣기

**사용법:**
1. 🎤 버튼 클릭하여 녹음 시작
2. 말하기 (예: "안녕하세요")
3. 🎤 버튼 다시 클릭하여 녹음 중지
4. AI가 자동으로 응답 음성 재생

### 2. 화상통화 + 음성 AI (`/video-room/{roomId}`)

**기능:**
- 📹 WebRTC 화상 통화
- 🤖 실시간 음성 AI 어시스턴트
- 💬 음성 대화 기록 패널
- 🔊 응답 재생 및 관리

**사용법:**
1. 화상 통화 입장
2. 🤖 버튼 클릭하여 AI와 음성 대화
3. 💬 버튼으로 음성 패널 토글
4. 대화 기록에서 🔊 버튼으로 재생

## 📋 API 엔드포인트

### 1. 음성 대화 처리

**POST** `/voice/process-voice`

**요청:**
```javascript
const formData = new FormData();
formData.append('audio_file', audioBlob, 'recording.webm');
formData.append('language', 'ko-KR');        // STT 언어
formData.append('tts_language', 'ko');       // TTS 언어
formData.append('speed', '1.0');             // TTS 속도
formData.append('voice_type', 'female');     // TTS 음성 타입
```

**응답:**
```json
{
  "transcript": "안녕하세요",
  "confidence": 0.85,
  "response_text": "안녕하세요! 무엇을 도와드릴까요?",
  "audio_base64": "UklGRnoGAABXQVZFZm10IBAAAAABAAEA...",
  "processed_at": "2025-07-30T12:34:56.789"
}
```

### 2. 텍스트 음성 변환

**POST** `/voice/text-to-speech`

**요청:**
```json
{
  "text": "변환할 텍스트",
  "language": "ko",
  "speed": 1.0,
  "voice_type": "female"
}
```

**응답:** MP3 오디오 파일

### 3. 음성 텍스트 변환

**POST** `/voice/speech-to-text`

**요청:**
```javascript
const formData = new FormData();
formData.append('audio_file', audioBlob);
formData.append('language', 'ko-KR');
```

**응답:**
```json
{
  "transcript": "인식된 텍스트",
  "confidence": 0.9,
  "processed_at": "2025-07-30T12:34:56.789"
}
```

## 🛠️ 기술 스택

### 백엔드 (AI 서버)
- **FastAPI**: 웹 프레임워크
- **SpeechRecognition**: Google Speech API
- **gTTS**: Google Text-to-Speech
- **pyttsx3**: 로컬 TTS 엔진 (백업)
- **pydub**: 오디오 처리

### 프론트엔드
- **React 19**: UI 라이브러리
- **MediaRecorder API**: 음성 녹음
- **Web Audio API**: 오디오 재생
- **Fetch API**: 서버 통신

## 🎛️ 설정 옵션

### STT (음성인식) 설정

```python
# 언어 설정
language = "ko-KR"  # 한국어
language = "en-US"  # 영어

# 음성인식 품질 설정
recognizer.energy_threshold = 4000        # 소음 임계값
recognizer.dynamic_energy_threshold = True # 동적 임계값
recognizer.pause_threshold = 0.8          # 일시정지 감지 시간
```

### TTS (음성합성) 설정

```python
# Google TTS
gTTS(text=text, lang="ko", slow=False)

# pyttsx3 (로컬)
engine.setProperty('rate', 200)      # 속도 (단어/분)
engine.setProperty('volume', 0.9)    # 볼륨 (0.0-1.0)
```

## 🎯 AI 챗봇 응답 로직

현재 구현된 간단한 응답 패턴:

```python
def generate_response_text(transcript: str) -> str:
    transcript_lower = transcript.lower().strip()
    
    # 인사
    if any(word in transcript_lower for word in ["안녕", "hello", "hi"]):
        return "안녕하세요! 무엇을 도와드릴까요?"
    
    # 날씨 관련
    elif any(word in transcript_lower for word in ["날씨", "weather"]):
        return "오늘 날씨가 궁금하시군요. 날씨 정보를 확인해드릴게요."
    
    # 질문
    elif any(word in transcript_lower for word in ["뭐야", "뭔가요", "what"]):
        return "더 구체적으로 질문해주시면 도움을 드릴 수 있습니다."
    
    # 감사 인사
    elif any(word in transcript_lower for word in ["고마워", "감사", "thank"]):
        return "천만에요! 언제든지 도움이 필요하시면 말씀해주세요."
    
    # 기본 응답
    else:
        return f"'{transcript}'라고 말씀하셨군요. 더 자세히 설명해주실 수 있나요?"
```

## 🔧 시스템 요구사항

### 서버 환경
- **Python 3.9+**
- **ffmpeg** (오디오 변환)
- **portaudio** (음성 처리)
- **인터넷 연결** (Google TTS/STT API)

### 클라이언트 환경
- **Chrome/Firefox** (최신 버전)
- **마이크 권한** 허용
- **HTTPS 또는 localhost** (MediaRecorder API 요구사항)

## 🚀 배포 설정

### Docker 배포

```dockerfile
# AI 서버 Dockerfile 추가
FROM python:3.9-slim

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    ffmpeg \
    portaudio19-dev \
    python3-pyaudio \
    flac \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 설치
COPY requirements.txt .
RUN pip install -r requirements.txt

# 앱 복사 및 실행
COPY . /app
WORKDIR /app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 환경변수 설정

```bash
# .env 파일
OPENAI_API_KEY=your_openai_api_key_here  # Whisper API용 (선택사항)
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json  # Google Cloud TTS용 (선택사항)
```

## 🐛 문제 해결

### 일반적인 오류

1. **마이크 권한 오류**
   ```
   해결: 브라우저 설정에서 마이크 권한 허용
   Chrome: 설정 → 개인정보 및 보안 → 사이트 설정 → 마이크
   ```

2. **오디오 코덱 지원 오류**
   ```javascript
   // 브라우저 호환성 확인
   if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
     mimeType = 'audio/webm;codecs=opus';
   } else {
     mimeType = 'audio/webm';
   }
   ```

3. **TTS 재생 오류**
   ```javascript
   // 사용자 상호작용 후 재생
   audio.play().catch(error => {
     console.log('자동 재생 차단됨. 사용자 액션 필요');
   });
   ```

4. **STT 인식 정확도 낮음**
   ```python
   # 배경 소음 조정
   recognizer.adjust_for_ambient_noise(source, duration=1.0)
   recognizer.energy_threshold = 4000
   ```

## 📈 성능 최적화

### 1. 오디오 품질 최적화
```javascript
const mediaConstraints = {
  audio: {
    sampleRate: 16000,      // 16kHz (음성 인식 최적)
    channelCount: 1,        // 모노
    echoCancellation: true, // 에코 제거
    noiseSuppression: true, // 노이즈 제거
    autoGainControl: true   // 자동 게인 조절
  }
};
```

### 2. API 응답 시간 최적화
```python
# 비동기 처리
async def process_voice_async(audio_data):
    # STT와 TTS를 병렬 처리
    stt_task = asyncio.create_task(speech_to_text(audio_data))
    # ... 기타 최적화
```

### 3. 메모리 관리
```javascript
// 오디오 URL 정리
URL.revokeObjectURL(audioUrl);

// 스트림 정리
stream.getTracks().forEach(track => track.stop());
```

## 🎮 사용 시나리오

### 시나리오 1: 독립 음성 채팅
1. `/voice-chat` 페이지 접속
2. 🎤 버튼으로 "안녕하세요" 녹음
3. AI 응답: "안녕하세요! 무엇을 도와드릴까요?" 자동 재생
4. 텍스트 입력으로도 TTS 테스트 가능

### 시나리오 2: 화상통화 중 AI 어시스턴트
1. `/video-room/room123` 접속
2. 화상통화 시작
3. 🤖 버튼으로 AI와 음성 대화
4. 💬 패널에서 대화 기록 확인
5. 이전 응답 🔊 버튼으로 재생

## 🔮 향후 개선 계획

1. **고급 AI 챗봇**: GPT API 연동으로 더 자연스러운 대화
2. **감정 분석**: 음성 톤 분석으로 감정 상태 파악
3. **다국어 지원**: 영어, 일본어, 중국어 등 추가
4. **음성 클로닝**: 사용자 목소리로 TTS 생성
5. **실시간 번역**: 음성 → 번역 → TTS

## 📞 지원

문제가 발생하면 다음을 확인해주세요:

1. **서버 상태**: http://localhost:8000/voice/health
2. **브라우저 콘솔**: 개발자 도구에서 오류 확인
3. **네트워크**: API 호출 상태 확인
4. **마이크 권한**: 브라우저 설정 확인

---

**참견도치 팀** - AI 기반 갈등 중재 플랫폼 🦔