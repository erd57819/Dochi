# app/routers/summary.py
from fastapi import APIRouter, Depends
from schemas import summary as summary_schema
from services.summaryService import SummaryService

router = APIRouter(prefix="/api/summary", tags=["summary"])

# 기본 분석 엔드포인트 제거됨 - /advanced 엔드포인트로 통합

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