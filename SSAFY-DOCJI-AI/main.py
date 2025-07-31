from fastapi import FastAPI
# CORSMiddleware를 import 합니다.
from fastapi.middleware.cors import CORSMiddleware
from routers import summary, stt_processing

app = FastAPI()

# CORS 미들웨어 설정
origins = [
    "http://localhost",
    "http://localhost:5173", # 리액트 개발 서버의 주소
    "http://localhost:8090", # nginx 프록시 주소
    "http://localhost:8080", # 백엔드 주소
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # 모든 HTTP 메소드 허용
    allow_headers=["*"], # 모든 HTTP 헤더 허용
)

# summary 라우터 등록
app.include_router(summary.router)
# STT processing 라우터 등록
app.include_router(stt_processing.router)

@app.get("/")
def read_root():
    return {"message": "Speech-to-Text API Server is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}