from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import sttRouter, speechRouter, voiceRouter, summary, websocketRouter, apiRouter

app = FastAPI(
    title="SSAFY DOCHI AI Server",
    description="AI-powered conflict mediation platform - Speech and Text Analysis API",
    version="2.0.0"
)

# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "https://localhost",     # nginx HTTPS
    "http://localhost:5173", # 리액트 개발 서버의 주소
    "http://localhost:8090", # nginx 프록시 주소
    "http://localhost:8080", # 백엔드 주소
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(apiRouter.router)          # API 정보
app.include_router(speechRouter.router)       # 음성 분석
app.include_router(summary.router)            # AI 요약

@app.get("/")
def readRoot():
    return {
        "message": "SSAFY DOCHI AI Server is running",
        "version": "2.0.0",
        "services": [
            "STT Processing",
            "Speech Analysis", 
            "Voice Chat",
            "AI Summary",
            "Real-time WebSocket"
        ]
    }

@app.get("/health")
def healthCheck():
    return {
        "status": "healthy", 
        "service": "dochi-ai-server",
        "version": "2.0.0"
    }

