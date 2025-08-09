from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from datetime import datetime
import json
from redis import Redis
from services.emotionGraphService import get_emotion_graph_data
from services.actionPlanService import aggregate_action_plans
from services.gpt_responsibility_service import analyze_responsibility_distribution

router = APIRouter(prefix="/conflict-report", tags=["conflict_report"])

# Redis 연결
r = Redis(host="dochi-redis", port=6379, decode_responses=True)

# @router.get("/{room_id}")
# async def get_conflict_report(room_id: str):
#     """
#     특정 방의 갈등 분석 레포트를 생성하여 반환합니다.
#     WebRTC 화상통화 종료 후 호출되는 최종 결과 API입니다.
#     """
#     try:
#         # 캐시 먼저 확인
#         cache_key = f"conflict:report:{room_id}"
#         cached_report = r.get(cache_key)
#         if cached_report:
#             print(f"[캐시 히트] {room_id}")
#             return json.loads(cached_report)
#         report = {
#             "room_id": room_id,
#             "generated_at": datetime.now().isoformat(),
#             "sections": {}
#         }
        
#         # 1. 전체 스크립트 가져오기
#         script_key = f"stt:raw:{room_id}"
#         full_script = r.lrange(script_key, 0, -1)
#         report["sections"]["full_transcript"] = {
#             "title": "전체 대화 내용",
#             "data": full_script,
#             "total_lines": len(full_script)
#         }
        
#         # 2. 감정 변화 그래프 데이터 수집
#         emotion_data = {}
#         pattern = f"emotion:summary:{room_id}:*"
#         emotion_keys = r.keys(pattern)
        
#         for key in emotion_keys:
#             speaker = key.split(":")[-1]
#             emotion_data[speaker] = get_emotion_graph_data(room_id, speaker, r)
        
#         report["sections"]["emotion_analysis"] = {
#             "title": "감정 변화 분석",
#             "data": emotion_data,
#             "summary": generate_emotion_summary(emotion_data)
#         }
        
#         # 3. 갈등 책임 분석
#         # 대화 청크들을 수집하여 책임 분석
#         transcripts = []
#         for i in range(10):  # 최대 10개 청크
#             chunk_key = f"stt:transcript:{room_id}:{i}"
#             lines = r.lrange(chunk_key, 0, -1)
#             if lines:
#                 for line in lines:
#                     if ": " in line:
#                         speaker, text = line.split(": ", 1)
#                         transcripts.append({
#                             "speaker": speaker,
#                             "text": text,
#                             "chunk_index": i
#                         })
        
#         if transcripts:
#             responsibility_analysis = analyze_responsibility_distribution(transcripts)
#         else:
#             # 전체 스크립트에서 분석
#             responsibility_analysis = {
#                 "responsibility_analysis": {},
#                 "conflict_triggers": [],
#                 "overall_assessment": {
#                     "severity": "LOW",
#                     "resolution_difficulty": 3
#                 }
#             }
            
#             if full_script:
#                 transcript_text = "\n".join(full_script)
#                 from services.gpt_responsibility_service import analyze_responsibility
#                 responsibility_analysis = analyze_responsibility(transcript_text)
        
#         report["sections"]["responsibility_analysis"] = {
#             "title": "갈등 책임 분석",
#             "data": responsibility_analysis
#         }
        
#         # 4. 화자별 액션 플랜
#         action_plans = aggregate_action_plans(room_id, r)
#         report["sections"]["action_plans"] = {
#             "title": "맞춤형 액션 플랜",
#             "data": action_plans
#         }
        
#         # 5. 요약 및 권장사항
#         report["sections"]["summary"] = {
#             "title": "종합 분석 요약",
#             "data": generate_final_summary(report)
#         }
        
#         # 6. 캐시에 저장 (24시간)
#         cache_key = f"conflict:report:{room_id}"
#         r.set(cache_key, json.dumps(report), ex=86400)
        
#         return report
        
#     except Exception as e:
#         print(f"[갈등 레포트 생성 오류] {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"갈등 분석 레포트 생성 중 오류가 발생했습니다: {str(e)}"
#         )


# @router.get("/{room_id}/summary")
# async def get_conflict_summary(room_id: str):
#     """
#     간단한 요약 정보만 반환합니다 (빠른 미리보기용).
#     """
#     try:
#         # 캐시된 레포트 확인
#         cache_key = f"conflict:report:{room_id}"
#         cached_report = r.get(cache_key)
        
#         if cached_report:
#             report = json.loads(cached_report)
#             summary = report.get("sections", {}).get("summary", {}).get("data", {})
#             return {
#                 "room_id": room_id,
#                 "summary": summary,
#                 "cached": True,
#                 "generated_at": report.get("generated_at")
#             }
        
#         # 캐시가 없으면 간단한 요약만 생성
#         script_key = f"stt:raw:{room_id}"
#         transcript_lines = r.lrange(script_key, 0, 10)  # 처음 10줄만
        
#         return {
#             "room_id": room_id,
#             "summary": {
#                 "status": "분석 필요",
#                 "transcript_preview": transcript_lines,
#                 "message": "전체 분석을 위해 /conflict-report/{room_id} 엔드포인트를 호출하세요."
#             },
#             "cached": False,
#             "generated_at": datetime.now().isoformat()
#         }
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"요약 생성 중 오류가 발생했습니다: {str(e)}"
#         )


# @router.get("/{room_id}/emotion-graph/{speaker}")
# async def get_speaker_emotion_graph(room_id: str, speaker: str):
#     """
#     특정 화자의 감정 변화 그래프 데이터를 반환합니다.
#     """
#     try:
#         emotion_data = get_emotion_graph_data(room_id, speaker, r)
        
#         if not emotion_data.get("timeline"):
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"화자 '{speaker}'의 감정 데이터를 찾을 수 없습니다."
#             )
        
#         return emotion_data
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"감정 그래프 데이터 조회 중 오류가 발생했습니다: {str(e)}"
#         )


# @router.get("/{room_id}/action-plan/{speaker}")
# async def get_speaker_action_plan(room_id: str, speaker: str):
#     """
#     특정 화자의 액션 플랜을 반환합니다.
#     """
#     try:
#         plan_key = f"action_plan:{room_id}:{speaker}"
#         plan_data = r.get(plan_key)
        
#         if not plan_data:
#             raise HTTPException(
#                 status_code=404,
#                 detail=f"화자 '{speaker}'의 액션 플랜을 찾을 수 없습니다."
#             )
        
#         return json.loads(plan_data)
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"액션 플랜 조회 중 오류가 발생했습니다: {str(e)}"
#         )


# @router.delete("/{room_id}/cache")
# async def clear_report_cache(room_id: str):
#     """
#     특정 방의 캐시된 레포트를 삭제합니다.
#     """
#     try:
#         cache_key = f"conflict:report:{room_id}"
#         deleted = r.delete(cache_key)
        
#         return {
#             "room_id": room_id,
#             "cache_cleared": bool(deleted),
#             "message": "캐시가 삭제되었습니다." if deleted else "캐시가 존재하지 않습니다."
#         }
        
#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"캐시 삭제 중 오류가 발생했습니다: {str(e)}"
#         )


# def generate_emotion_summary(emotion_data: Dict) -> Dict:
#     """
#     감정 데이터를 요약합니다.
    
#     Args:
#         emotion_data: 화자별 감정 데이터
        
#     Returns:
#         Dict: 감정 요약
#     """
#     if not emotion_data:
#         return {"message": "감정 데이터가 없습니다."}
    
#     summary = {
#         "total_speakers": len(emotion_data),
#         "speakers": [],
#         "overall_mood": "neutral",
#         "emotion_volatility": "low"
#     }
    
#     total_score = 0
#     volatility_scores = []
    
#     for speaker, data in emotion_data.items():
#         speaker_summary = data.get("summary", {})
        
#         speaker_info = {
#             "name": speaker,
#             "dominant_emotion": speaker_summary.get("dominant_emotion", "unknown"),
#             "average_score": speaker_summary.get("average_score", 0),
#             "total_samples": speaker_summary.get("total_samples", 0)
#         }
        
#         summary["speakers"].append(speaker_info)
#         total_score += speaker_summary.get("average_score", 0)
        
#         # 감정 변화 정도 계산
#         changes = speaker_summary.get("emotion_changes", [])
#         if len(changes) > 1:
#             volatility = len(set(c.get("emotion") for c in changes)) / len(changes)
#             volatility_scores.append(volatility)
    
#     # 전체 분위기 판단
#     if summary["speakers"]:
#         avg_score = total_score / len(summary["speakers"])
#         if avg_score > 0.3:
#             summary["overall_mood"] = "positive"
#         elif avg_score < -0.3:
#             summary["overall_mood"] = "negative"
    
#     # 감정 변동성 판단
#     if volatility_scores:
#         avg_volatility = sum(volatility_scores) / len(volatility_scores)
#         if avg_volatility > 0.7:
#             summary["emotion_volatility"] = "high"
#         elif avg_volatility > 0.4:
#             summary["emotion_volatility"] = "medium"
    
#     return summary


# def generate_final_summary(report: Dict) -> Dict:
#     """
#     전체 레포트를 요약합니다.
    
#     Args:
#         report: 전체 레포트 데이터
        
#     Returns:
#         Dict: 최종 요약
#     """
#     sections = report.get("sections", {})
    
#     summary = {
#         "conflict_level": "LOW",
#         "resolution_feasibility": "HIGH",
#         "key_issues": [],
#         "immediate_actions": [],
#         "success_probability": 70,
#         "professional_help_needed": False
#     }
    
#     # 책임 분석에서 정보 추출
#     responsibility = sections.get("responsibility_analysis", {}).get("data", {})
#     if responsibility:
#         assessment = responsibility.get("overall_assessment", {})
#         summary["conflict_level"] = assessment.get("severity", "MEDIUM")
        
#         difficulty = assessment.get("resolution_difficulty", 5)
#         if difficulty <= 3:
#             summary["resolution_feasibility"] = "HIGH"
#         elif difficulty <= 7:
#             summary["resolution_feasibility"] = "MEDIUM"
#         else:
#             summary["resolution_feasibility"] = "LOW"
#             summary["professional_help_needed"] = True
        
#         summary["key_issues"] = responsibility.get("conflict_triggers", [])[:3]
    
#     # 액션 플랜에서 즉시 실행 항목 추출
#     action_plans = sections.get("action_plans", {}).get("data", {})
#     if action_plans:
#         priority_actions = action_plans.get("priority_actions", [])
#         summary["immediate_actions"] = [
#             action.get("action", "") for action in priority_actions[:3]
#         ]
    
#     # 감정 분석에서 정보 추출
#     emotion_summary = sections.get("emotion_analysis", {}).get("summary", {})
#     if emotion_summary.get("emotion_volatility") == "high":
#         summary["conflict_level"] = "HIGH"
#         summary["success_probability"] -= 20
    
#     # 성공 확률 조정
#     if summary["conflict_level"] == "HIGH":
#         summary["success_probability"] = min(40, summary["success_probability"])
#     elif summary["conflict_level"] == "LOW":
#         summary["success_probability"] = max(80, summary["success_probability"])
    
#     return summary


@router.get("/{room_id}")
async def get_conflict_report(room_id: str):
    try:
        return {
            "room_id": room_id,
            "generated_at": datetime.now().isoformat(),
            "status": "success",
            "test_message": "간단한 응답 테스트"
        }
    except Exception as e:
        print(f"에러: {e}")
        return {"error": str(e)}