# app/routers/summary.py
from fastapi import APIRouter, Depends
from schemas import summary as summary_schema
from services.summary_service import SummaryService

router = APIRouter(prefix="/api/summary", tags=["summary"])

@router.post("/", response_model=summary_schema.SummaryResponse)
def get_summary(
    request: summary_schema.SummaryRequest,
    summary_service: SummaryService = Depends(SummaryService)
):
    summary_text = summary_service.summarize(
        text=request.original_text, 
    )
    return summary_schema.SummaryResponse(summary_text=summary_text)

@router.post("/advanced", response_model=dict)
def get_advanced_analysis(
    request: summary_schema.AdvancedAnalysisRequest,
    summary_service: SummaryService = Depends(SummaryService)
):
    """고급 AI 분석 - 감정, 관계, 소통 등 다면적 분석"""
    analysis_result = summary_service.advanced_analysis(
        text=request.original_text,
        conflict_type=request.conflict_type
    )
    return analysis_result