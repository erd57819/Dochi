from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import faceRouter, speechRouter, summary, apiRouter, conflictReportRouter, websocketRouter
from core.config import settings

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

@app.on_event("startup")
def startup_event():
    print("[Startup] SSAFY DOCHI AI Server started successfully")
    print("[Startup] Running in direct API mode (Kafka disabled)")

@app.on_event("shutdown") 
def shutdown_event():
    print("[Shutdown] SSAFY DOCHI AI Server stopped")
