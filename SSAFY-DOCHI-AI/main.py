from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import faceRouter, speechRouter, summary, apiRouter, conflictReportRouter, websocketRouter
from services.kafkaService import init_kafka_producer, close_kafka_producer
from core.config import settings
# Consumer들 import
from consumers.sttConsumer import STTConsumer
from consumers.emotionConsumer import EmotionConsumer
from consumers.scriptConsumer import ScriptConsumer
from consumers.summaryConsumer import SummaryConsumer
import threading

app = FastAPI(
    title="SSAFY DOCHI AI Server",
    description="AI-powered conflict mediation platform - Speech and Text Analysis API",
    version="2.0.0"
)

# CORS 설정
origins = [
    "http://localhost",
    "https://localhost",
    "http://localhost:5173",
    "http://localhost:8090",
    "http://localhost:8080",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(apiRouter.router)
app.include_router(speechRouter.router)
app.include_router(summary.router)
app.include_router(faceRouter.router)
app.include_router(conflictReportRouter.router)
app.include_router(websocketRouter.router)

@app.get("/")
def read_root():
    return {
        "message": "SSAFY DOCHI AI Server is running",
        "version": "2.0.0",
        "services": [
            "STT Processing",
            "Speech Analysis",
            "Voice Chat",
            "AI Summary",
            "AI Coaching",
            "Real-time WebSocket"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "dochi-ai-server",
        "version": "2.0.0"
    }

# Consumer 인스턴스들 저장
consumers = []

# 앱 시작 시 Kafka 초기화
@app.on_event("startup")
def startup_event():
    global consumers
    
    try:
        init_kafka_producer()
        print("[Startup] Kafka producer initialized successfully")
        
        # Consumer들 초기화 및 실행 (안전 모드)
        if settings.use_kafka:
            consumers = [
                STTConsumer(),
                EmotionConsumer(), 
                ScriptConsumer(),
                SummaryConsumer()
            ]
            
            for consumer in consumers:
                try:
                    consumer.init_consumer()
                    # 각 Consumer를 별도 스레드에서 실행
                    thread = threading.Thread(target=consumer.start, daemon=True)
                    thread.start()
                    print(f"[Startup] {consumer.__class__.__name__} started in background thread")
                except Exception as e:
                    print(f"[Startup Error] Failed to start {consumer.__class__.__name__}: {e}")
        else:
            print("[Startup] Kafka disabled - running in API-only mode")
            
    except Exception as e:
        print(f"[Startup Critical Error] {e}")
        # FastAPI는 계속 실행하되 Kafka 기능만 비활성화
        pass

# 앱 종료 시 Kafka 정리
@app.on_event("shutdown")
def shutdown_event():
    global consumers
    
    # Consumer들 종료
    for consumer in consumers:
        try:
            consumer.close_consumer()
            print(f"[Shutdown] {consumer.__class__.__name__} closed successfully")
        except Exception as e:
            print(f"[Shutdown Error] Failed to close {consumer.__class__.__name__}: {e}")
    
    close_kafka_producer()
