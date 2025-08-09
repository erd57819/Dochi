import openai
from core.config import settings
from typing import Dict, List
import json

# OpenAI 클라이언트 설정
client = openai.OpenAI(
    api_key=settings.GMS_KEY,
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
)

def analyze_responsibility(transcript: str) -> Dict:
    """
    대화 내용을 분석하여 갈등 책임 비중을 분석합니다.
    
    Args:
        transcript: 대화 녹취록 (화자: 내용 형식)
        
    Returns:
        Dict: 책임 분석 결과
    """
    try:
        prompt = f"""
다음 대화 내용을 분석하여 갈등의 책임 비중과 원인을 분석해주세요.

대화 내용:
{transcript}

다음 항목들을 JSON 형식으로 분석해주세요:

{{
  "responsibility_analysis": {{
    "speaker1": {{
      "name": "화자1 이름",
      "responsibility_percentage": 책임 비중 (0-100),
      "key_issues": ["주요 문제점1", "주요 문제점2"],
      "problematic_statements": ["문제가 된 발언1", "문제가 된 발언2"],
      "communication_style": "의사소통 스타일 분석"
    }},
    "speaker2": {{
      "name": "화자2 이름",
      "responsibility_percentage": 책임 비중 (0-100),
      "key_issues": ["주요 문제점1", "주요 문제점2"],
      "problematic_statements": ["문제가 된 발언1", "문제가 된 발언2"],
      "communication_style": "의사소통 스타일 분석"
    }}
  }},
  "conflict_triggers": ["갈등 촉발 요인1", "갈등 촉발 요인2"],
  "escalation_points": [
    {{
      "timestamp": "대화 시점",
      "description": "갈등이 고조된 지점 설명",
      "responsible_party": "책임 화자"
    }}
  ],
  "mutual_responsibility": {{
    "shared_issues": ["공동 책임 사항들"],
    "communication_breakdown": "의사소통 실패 분석",
    "suggestions": ["개선 제안사항들"]
  }},
  "overall_assessment": {{
    "primary_responsible": "주 책임자",
    "conflict_type": "갈등 유형",
    "severity": "HIGH|MEDIUM|LOW",
    "resolution_difficulty": "해결 난이도 (1-10)"
  }}
}}

분석 시 주의사항:
1. 객관적이고 공정하게 분석
2. 감정적 표현보다는 행동과 발언에 초점
3. 양측의 입장을 균형있게 고려
4. 건설적인 피드백 제공
5. 책임 비중의 합은 100%가 되도록 설정

응답은 반드시 유효한 JSON 형식으로만 제공해주세요.
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3  # 더 일관된 분석을 위해 낮은 temperature 사용
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # JSON 파싱 시도
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # JSON 파싱 실패 시 기본 구조 반환
            result = {
                "responsibility_analysis": {
                    "speaker1": {
                        "name": "화자1",
                        "responsibility_percentage": 50,
                        "key_issues": ["분석 실패"],
                        "problematic_statements": [],
                        "communication_style": "분석 불가"
                    },
                    "speaker2": {
                        "name": "화자2",
                        "responsibility_percentage": 50,
                        "key_issues": ["분석 실패"],
                        "problematic_statements": [],
                        "communication_style": "분석 불가"
                    }
                },
                "conflict_triggers": ["분석 실패"],
                "escalation_points": [],
                "mutual_responsibility": {
                    "shared_issues": ["분석 실패"],
                    "communication_breakdown": "분석 불가",
                    "suggestions": ["전문가 상담 권장"]
                },
                "overall_assessment": {
                    "primary_responsible": "판단 불가",
                    "conflict_type": "미분류",
                    "severity": "MEDIUM",
                    "resolution_difficulty": 5
                },
                "error": "AI 분석 결과 파싱 실패"
            }
        
        # 책임 비중 합계 검증 및 조정
        if "responsibility_analysis" in result:
            total = 0
            speakers = list(result["responsibility_analysis"].keys())
            for speaker in speakers:
                total += result["responsibility_analysis"][speaker].get("responsibility_percentage", 0)
            
            # 합이 100이 아니면 조정
            if total != 100 and total > 0:
                for speaker in speakers:
                    current = result["responsibility_analysis"][speaker].get("responsibility_percentage", 0)
                    result["responsibility_analysis"][speaker]["responsibility_percentage"] = round(current * 100 / total)
        
        return result
        
    except Exception as e:
        print(f"[책임 분석 오류] {e}")
        return {
            "responsibility_analysis": {
                "speaker1": {
                    "name": "화자1",
                    "responsibility_percentage": 50,
                    "key_issues": ["분석 오류 발생"],
                    "problematic_statements": [],
                    "communication_style": "분석 불가"
                },
                "speaker2": {
                    "name": "화자2", 
                    "responsibility_percentage": 50,
                    "key_issues": ["분석 오류 발생"],
                    "problematic_statements": [],
                    "communication_style": "분석 불가"
                }
            },
            "conflict_triggers": ["분석 오류"],
            "escalation_points": [],
            "mutual_responsibility": {
                "shared_issues": ["분석 오류"],
                "communication_breakdown": "분석 불가",
                "suggestions": ["다시 시도해주세요"]
            },
            "overall_assessment": {
                "primary_responsible": "판단 불가",
                "conflict_type": "오류",
                "severity": "MEDIUM",
                "resolution_difficulty": 5
            },
            "error": str(e)
        }


def analyze_responsibility_distribution(transcripts: List[Dict]) -> Dict:
    """
    여러 대화 청크의 책임 분포를 종합 분석합니다.
    
    Args:
        transcripts: 대화 청크 리스트
        
    Returns:
        Dict: 종합 책임 분석 결과
    """
    try:
        # 모든 대화를 하나로 합치기
        full_transcript = "\n".join([
            f"{t.get('speaker', '화자')}: {t.get('text', '')}"
            for t in transcripts
        ])
        
        # 전체 대화 분석
        analysis = analyze_responsibility(full_transcript)
        
        # 시간대별 책임 변화 추적
        timeline_analysis = []
        for i, chunk in enumerate(transcripts):
            chunk_text = f"{chunk.get('speaker', '화자')}: {chunk.get('text', '')}"
            chunk_analysis = analyze_responsibility(chunk_text)
            timeline_analysis.append({
                "chunk_index": i,
                "timestamp": chunk.get("timestamp", ""),
                "responsibility": chunk_analysis.get("responsibility_analysis", {})
            })
        
        # 종합 결과에 타임라인 추가
        analysis["timeline"] = timeline_analysis
        
        return analysis
        
    except Exception as e:
        print(f"[책임 분포 분석 오류] {e}")
        return {
            "error": str(e),
            "responsibility_analysis": {},
            "timeline": []
        }