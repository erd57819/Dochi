from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import faceRouter, speechRouter, summary, apiRouter, conflictReportRouter
from services.kafkaService import init_kafka_producer, close_kafka_producer
# 필요하면 Consumer도 import
# from services.myConsumer import MyConsumerClass

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

# 앱 시작 시 Kafka 초기화
@app.on_event("startup")
def startup_event():
    init_kafka_producer()
    # 필요 시 Consumer 초기화
    # my_consumer = MyConsumerClass("my-topic")
    # my_consumer.init_consumer()
    # my_consumer.start()

# 앱 종료 시 Kafka 정리
@app.on_event("shutdown")
def shutdown_event():
    close_kafka_producer()
    # 필요 시 Consumer 종료 호출
    # my_consumer.close_consumer()
