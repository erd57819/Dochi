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