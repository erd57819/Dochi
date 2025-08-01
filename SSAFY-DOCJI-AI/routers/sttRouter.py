from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from datetime import datetime
from schemas.sttSchemas import SttResponse, SttAnalysisResponse
from services.sttService import SttService

router = APIRouter(prefix="/stt", tags=["speech_to_text"])
sttService = SttService()

@router.post("/transcribe", response_model=SttResponse)
async def transcribeAudio(
    audioFile: UploadFile = File(...),
    model: str = Form(default="whisper-1")
):
    """오디오 파일을 받아서 GMS API (Whisper-1)로 텍스트 변환합니다."""
    
    if not audioFile.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다. 지원 형식: mp3, wav, webm, ogg, mp4"
        )
    
    try:
        audioContent = await audioFile.read()
        filename = audioFile.filename or "audio.webm"
        
        result = await sttService.processAudio(audioContent, filename, model)
        
        return SttResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"STT 처리 중 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/transcribe-and-analyze", response_model=SttAnalysisResponse)
async def transcribeAndAnalyze(
    audioFile: UploadFile = File(...),
    model: str = Form(default="whisper-1"),
    analyzeEmotion: bool = Form(default=True),
    analyzeConflict: bool = Form(default=True)
):
    """오디오 파일을 텍스트로 변환하고 감정/갈등 분석을 수행합니다."""
    
    if not audioFile.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400, 
            detail="오디오 파일만 업로드 가능합니다"
        )
    
    try:
        audioContent = await audioFile.read()
        filename = audioFile.filename or "audio.webm"
        
        result = await sttService.processAudioWithAnalysis(
            audioContent, filename, model, analyzeEmotion, analyzeConflict
        )
        
        return SttAnalysisResponse(**result)
    
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"STT 분석 처리 중 오류: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"음성 분석 처리 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
async def healthCheck():
    """STT 서비스 상태를 확인합니다."""
    return {
        "status": "healthy",
        "service": "speech-to-text",
        "version": "2.0.0",
        "features": {
            "speechToText": "GMS API (Whisper-1)",
            "emotionAnalysis": "키워드 기반 감정 분석",
            "conflictDetection": "다층 갈등 위험도 분석",
            "feedbackGeneration": "상황별 대화 개선 제안"
        },
        "supportedFormats": ["mp3", "wav", "webm", "ogg", "mp4"],
        "maxFileSize": "25MB",
        "timestamp": datetime.now().isoformat()
    }