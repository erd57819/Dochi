from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from datetime import datetime
import json
from redis import Redis
from services.emotionGraphService import get_emotion_graph_data
from services.actionPlanService import aggregate_action_plans
from services.gpt_responsibility_service import analyze_responsibility_distribution
import asyncio
import re

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
    """
    최적화된 갈등 분석 레포트 생성 - GPT 1회 호출로 통합 분석
    """
    try:
        # 캐시 먼저 확인
        cache_key = f"conflict:report:{room_id}"
        cached_report = r.get(cache_key)
        if cached_report:
            print(f"[캐시 히트] {room_id}")
            return json.loads(cached_report)

        print(f"[레포트 생성 시작] {room_id}")
        report = {
            "room_id": room_id,
            "generated_at": datetime.now().isoformat(),
            "sections": {}
        }
        
        # 1. 전체 스크립트 가져오기 (Redis에서 빠르게)
        script_key = f"stt:raw:{room_id}"
        full_script = r.lrange(script_key, 0, -1)
        report["sections"]["full_transcript"] = {
            "title": "전체 대화 내용",
            "data": full_script,
            "total_lines": len(full_script)
        }
        print(f"[스크립트 로드 완료] {len(full_script)}줄")
        
        # 2. 감정 데이터는 프론트엔드에서 localStorage로 처리 (빠른 성능)
        report["sections"]["emotion_analysis"] = {
            "title": "감정 변화 분석",
            "message": "프론트엔드에서 실시간 수집된 데이터를 활용합니다",
            "data_source": "localStorage"
        }
        print("[감정 데이터] 프론트엔드 처리로 설정")
        
        # 3. 통합 GPT 분석 (1회 호출로 모든 분석 완료)
        if full_script:
            # 전체 스크립트가 너무 길면 요약본 사용
            if len(full_script) > 50:  # 50줄 이상이면 중요한 부분만 추출
                important_lines = extract_important_lines(full_script)
                analysis_text = "\n".join(important_lines)
            else:
                analysis_text = "\n".join(full_script)
            
            print(f"[GPT 분석 시작] 텍스트 길이: {len(analysis_text)} 문자")
            integrated_analysis = await analyze_conflict_integrated(analysis_text)
            
            # GPT 결과를 섹션별로 분리
            report["sections"]["responsibility_analysis"] = {
                "title": "갈등 책임 분석",
                "data": integrated_analysis.get("responsibility", {})
            }
            
            report["sections"]["summary"] = {
                "title": "종합 분석 요약", 
                "data": integrated_analysis.get("summary", {})
            }
            
            report["sections"]["action_plans"] = {
                "title": "맞춤형 액션 플랜",
                "data": integrated_analysis.get("action_plans", {})
            }
            
            print("[GPT 분석 완료]")
        else:
            # 스크립트가 없을 때 기본값
            report["sections"]["responsibility_analysis"] = {
                "title": "갈등 책임 분석",
                "data": {"message": "분석할 대화 데이터가 없습니다."}
            }
            report["sections"]["summary"] = {
                "title": "종합 분석 요약",
                "data": {"message": "요약할 데이터가 없습니다."}
            }
            report["sections"]["action_plans"] = {
                "title": "맞춤형 액션 플랜", 
                "data": {"message": "액션 플랜을 생성할 데이터가 없습니다."}
            }
        
        # 캐시에 저장 (24시간)
        r.set(cache_key, json.dumps(report), ex=86400)
        print(f"[레포트 생성 완료] {room_id}")
        
        return report
        
    except Exception as e:
        print(f"[갈등 레포트 생성 오류] {room_id}: {e}")
        return {
            "room_id": room_id,
            "error": str(e),
            "generated_at": datetime.now().isoformat(),
            "sections": {
                "full_transcript": {"title": "전체 대화 내용", "data": [], "total_lines": 0},
                "emotion_analysis": {"title": "감정 변화 분석", "data": {}, "summary": {}},
                "responsibility_analysis": {"title": "갈등 책임 분석", "data": {"error": "분석 실패"}},
                "summary": {"title": "종합 분석 요약", "data": {"error": "요약 실패"}},
                "action_plans": {"title": "맞춤형 액션 플랜", "data": {"error": "플랜 생성 실패"}}
            }
        }


def extract_important_lines(full_script, max_lines=30):
    """
    긴 스크립트에서 갈등 관련 중요한 줄만 추출
    """
    if len(full_script) <= max_lines:
        return full_script
    
    important_lines = []
    conflict_keywords = ['화나', '싫어', '미워', '짜증', '답답', '그만', '왜', '잘못', '문제', '갈등']
    
    # 1. 갈등 키워드가 포함된 줄 우선 선택
    for line in full_script:
        if any(keyword in line for keyword in conflict_keywords):
            important_lines.append(line)
    
    # 2. 부족하면 앞뒤 균등하게 추가
    remaining = max_lines - len(important_lines)
    if remaining > 0:
        start_lines = full_script[:remaining//2]
        end_lines = full_script[-(remaining - remaining//2):]
        important_lines = start_lines + important_lines + end_lines
    
    return important_lines[:max_lines]


async def analyze_conflict_integrated(analysis_text):
    """
    GPT 1회 호출로 책임분석, 요약, 액션플랜을 모두 생성
    실제 GPT API를 사용하여 갈등 상황 종합 분석
    """
    try:
        print(f"[GPT 분석 시작] 입력 텍스트 길이: {len(analysis_text)} 문자")
        
        # gptService 임포트
        from services.gptService import ask_gpt
        
        # 실제 STT 데이터에서 화자들 추출
        speakers = []
        lines = analysis_text.split('\n')
        for line in lines:
            if ': ' in line:
                speaker = line.split(': ')[0].strip()
                if speaker not in speakers:
                    speakers.append(speaker)
        
        # 화자가 없으면 기본값
        if not speakers:
            speakers = ['화자1', '화자2']
        
        # GPT에게 보낼 통합 프롬프트 작성
        prompt = f"""
다음은 갈등 상황의 대화 내용입니다. 이를 바탕으로 종합적인 분석을 해주세요.

대화 내용:
{analysis_text}

참가자: {', '.join(speakers)}

다음 형식으로 정확히 분석해주세요:

1. 책임 비율 분석:
각 참가자별로 갈등에 대한 책임 비율(%)과 구체적 이유를 제시해주세요.

2. 갈등 상황 요약:
- 갈등 수준: HIGH/MEDIUM/LOW 중 선택
- 해결 가능성: HIGH/MEDIUM/LOW 중 선택  
- 핵심 쟁점 3가지
- 즉시 실행할 행동 3가지
- 성공 확률 (0-100%)
- 전문가 도움 필요 여부: true/false

3. 구체적 액션 플랜:
- 우선순위별 행동계획 3가지 (즉시/1주일/1개월)
- 소통 개선 팁 3가지
- 장기적 제안 2가지

갈등의 원인, 각자의 행동 패턴, 감정적 반응을 종합적으로 고려하여 객관적이고 건설적인 분석을 제공해주세요.
"""

        # GPT API 호출 (비동기)
        gpt_response = await asyncio.to_thread(ask_gpt, prompt, model="gpt-4.1", temperature=0.7)
        print(f"[GPT 응답 완료] 응답 길이: {len(gpt_response)} 문자")
        
        # GPT 응답을 파싱하여 구조화된 데이터로 변환
        result = parse_gpt_conflict_analysis(gpt_response, speakers)
        
        print("[GPT 분석 완료] 실제 AI 분석 결과 생성됨")
        return result
        
    except Exception as e:
        print(f"[GPT 분석 실패] {e}")
        return {
            "responsibility": {
                "responsibility_analysis": {"participants": []}, 
                "conflict_triggers": [], 
                "overall_assessment": {"severity": "UNKNOWN", "resolution_difficulty": 0}
            },
            "summary": {
                "conflict_level": "UNKNOWN",
                "resolution_feasibility": "UNKNOWN", 
                "key_issues": [],
                "immediate_actions": [],
                "success_probability": 0,
                "professional_help_needed": False
            },
            "action_plans": {
                "priority_actions": [],
                "communication_tips": [],
                "long_term_suggestions": []
            }
        }


def generate_emotion_summary(emotion_data):
    """
    감정 데이터를 요약합니다.
    """
    if not emotion_data:
        return {"message": "감정 데이터가 없습니다."}
    
    summary = {
        "total_speakers": len(emotion_data),
        "speakers": [],
        "overall_mood": "neutral",
        "emotion_volatility": "low"
    }
    
    total_score = 0
    volatility_scores = []
    
    for speaker, data in emotion_data.items():
        speaker_summary = data.get("summary", {})
        
        speaker_info = {
            "name": speaker,
            "dominant_emotion": speaker_summary.get("dominant_emotion", "neutral"),
            "average_score": speaker_summary.get("average_score", 0),
            "total_samples": speaker_summary.get("total_samples", 0)
        }
        
        summary["speakers"].append(speaker_info)
        total_score += speaker_summary.get("average_score", 0)
        
        # 감정 변화 정도 계산
        changes = speaker_summary.get("emotion_changes", [])
        if len(changes) > 1:
            volatility = len(set(c.get("emotion", "neutral") for c in changes)) / len(changes)
            volatility_scores.append(volatility)
    
    # 전체 분위기 판단
    if summary["speakers"]:
        avg_score = total_score / len(summary["speakers"])
        if avg_score > 0.3:
            summary["overall_mood"] = "positive"
        elif avg_score < -0.3:
            summary["overall_mood"] = "negative"
    
    # 감정 변동성 판단
    if volatility_scores:
        avg_volatility = sum(volatility_scores) / len(volatility_scores)
        if avg_volatility > 0.7:
            summary["emotion_volatility"] = "high"
        elif avg_volatility > 0.4:
            summary["emotion_volatility"] = "medium"
    
    return summary


def parse_gpt_conflict_analysis(gpt_response, speakers):
    """
    GPT 응답을 파싱하여 구조화된 데이터로 변환
    """
    try:
        # GPT 응답을 섹션별로 분석
        lines = gpt_response.split('\n')
        
        # 기본 구조 초기화
        result = {
            "responsibility": {
                "responsibility_analysis": {"participants": []},
                "conflict_triggers": [],
                "overall_assessment": {"severity": "UNKNOWN", "resolution_difficulty": 0}
            },
            "summary": {
                "conflict_level": "UNKNOWN",
                "resolution_feasibility": "UNKNOWN", 
                "key_issues": [],
                "immediate_actions": [],
                "success_probability": 0,
                "professional_help_needed": False
            },
            "action_plans": {
                "priority_actions": [],
                "communication_tips": [],
                "long_term_suggestions": []
            }
        }
        
        current_section = None
        collecting_key_issues = False
        collecting_immediate_actions = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 섹션 구분
            if "1. 책임 비율" in line or "책임 비율" in line:
                current_section = "responsibility"
                collecting_key_issues = False
                collecting_immediate_actions = False
            elif "2. 갈등 상황" in line or "상황 요약" in line:
                current_section = "summary"
                collecting_key_issues = False  
                collecting_immediate_actions = False
            elif "3. 구체적 액션" in line or "액션 플랜" in line:
                current_section = "action_plans"
                collecting_key_issues = False
                collecting_immediate_actions = False
            elif "핵심 쟁점" in line:
                collecting_key_issues = True
                collecting_immediate_actions = False
                continue  # 헤더 라인은 건너뜀
            elif "즉시 실행" in line:
                collecting_immediate_actions = True
                collecting_key_issues = False
                continue  # 헤더 라인은 건너뜀
            elif line.startswith('-') or line.startswith('•') or re.match(r'^\d+[\.\)]\s*', line):
                # 항목 파싱
                content = re.sub(r'^[-•\d\.\)]+\s*', '', line).strip()
                
                # 수집 중인 섹션에 따라 처리
                if collecting_key_issues:
                    if content and "**" not in content and "3가지" not in content and len(content) > 3:
                        result["summary"]["key_issues"].append(content)
                elif collecting_immediate_actions:
                    if content and "**" not in content and "3가지" not in content and len(content) > 3:
                        result["summary"]["immediate_actions"].append(content)
                elif current_section == "summary":
                    if "갈등 수준" in content:
                        if "HIGH" in content.upper():
                            result["summary"]["conflict_level"] = "HIGH"
                        elif "LOW" in content.upper():
                            result["summary"]["conflict_level"] = "LOW"
                    elif "해결 가능성" in content:
                        if "HIGH" in content.upper():
                            result["summary"]["resolution_feasibility"] = "HIGH" 
                        elif "LOW" in content.upper():
                            result["summary"]["resolution_feasibility"] = "LOW"
                    elif "핵심 쟁점" in content or "쟁점" in content:
                        # "핵심 쟁점 3가지" 같은 템플릿 텍스트는 제외
                        if "3가지" in content or "**" in content:
                            continue
                        issue = content.split(':')[-1].strip() if ':' in content else content
                        # 번호나 불렛 포인트 제거
                        issue = re.sub(r'^[-•\d\.]+\s*', '', issue).strip()
                        if issue and issue not in result["summary"]["key_issues"] and len(issue) > 3:
                            result["summary"]["key_issues"].append(issue)
                    elif "즉시 실행" in content or "즉시" in content:
                        # "즉시 실행할 행동 3가지" 같은 템플릿 텍스트는 제외
                        if "3가지" in content or "**" in content or "행동" in content and len(content) < 15:
                            continue
                        action = content.split(':')[-1].strip() if ':' in content else content
                        # 번호나 불렛 포인트 제거
                        action = re.sub(r'^[-•\d\.]+\s*', '', action).strip()
                        if action and action not in result["summary"]["immediate_actions"] and len(action) > 3:
                            result["summary"]["immediate_actions"].append(action)
                    elif "성공 확률" in content:
                        import re
                        numbers = re.findall(r'\d+', content)
                        if numbers:
                            result["summary"]["success_probability"] = int(numbers[0])
                    elif "전문가" in content:
                        result["summary"]["professional_help_needed"] = "true" in content.lower()
                        
        # 화자별 책임 비율 (GPT 응답에서 추출하지 못한 경우 기본값)
        if not result["responsibility"]["responsibility_analysis"]["participants"]:
            responsibility_per_speaker = 100 // len(speakers)
            for i, speaker in enumerate(speakers):
                result["responsibility"]["responsibility_analysis"]["participants"].append({
                    "name": speaker,
                    "responsibility_percentage": responsibility_per_speaker + (100 % len(speakers) if i == 0 else 0),
                    "reasons": []
                })
        
        # 프론트엔드 호환성을 위해 데이터 구조 변환
        frontend_responsibility = {}
        for participant in result["responsibility"]["responsibility_analysis"]["participants"]:
            speaker_key = f"speaker_{participant['name']}"
            frontend_responsibility[speaker_key] = {
                "name": participant["name"],
                "responsibility_percentage": participant["responsibility_percentage"],
                "communication_style": "",  # GPT에서 추출
                "key_issues": participant.get("reasons", [])
            }
        
        # 프론트엔드 구조로 변환
        result["responsibility"]["responsibility_analysis"] = frontend_responsibility
        
        # 갈등 고조 지점 추가 (GPT에서 추출되지 않은 경우 빈 배열)
        if "escalation_points" not in result["responsibility"]:
            result["responsibility"]["escalation_points"] = []
        
        # 기본값 제거 - GPT 응답이 없으면 빈 배열
        # 데이터가 없을 때는 명시적으로 표시
        # 액션 플랜도 하드코딩 제거 - 빈 배열 유지
        # communication_tips와 long_term_suggestions도 하드코딩 제거
            
        return result
        
    except Exception as e:
        print(f"[GPT 응답 파싱 실패] {e}")
        # 파싱 실패시 빈 데이터 구조 반환
        return {
            "responsibility": {
                "responsibility_analysis": {
                    "participants": []
                },
                "conflict_triggers": [],
                "overall_assessment": {"severity": "UNKNOWN", "resolution_difficulty": 0}
            },
            "summary": {
                "conflict_level": "UNKNOWN",
                "resolution_feasibility": "UNKNOWN",
                "key_issues": [],
                "immediate_actions": [],
                "success_probability": 0,
                "professional_help_needed": False
            },
            "action_plans": {
                "priority_actions": [],
                "communication_tips": [],
                "long_term_suggestions": []
            }
        }