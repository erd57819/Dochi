# app/services/summary_service.py

from core.config import settings
import openai

class SummaryService:
    def __init__(self):
        # OpenAI 클라이언트 설정 변경
        self.client = openai.OpenAI(
            api_key=settings.GMS_KEY,
            base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1"
        )
        self.gpt_model = "gpt-4o-mini"

    def summarize(self, text: str, conflict_type: str) -> str:
        try:
            prompt = f"""
    다음은 사용자가 작성한 갈등 상황입니다.

    갈등 상황: {text}
    갈등 유형: {conflict_type}

    아래 항목들을 간결하게 분석해주세요. 각 항목은 최대 2~3줄 이내, 전체는 5~6줄 이내의 짧고 공감 있는 한글 문장으로 작성해주세요.

    ※ 응답은 반드시 HTML 형식으로 작성해주세요.
    예시:
    <b>표면 감정과 숨겨진 감정</b>: 겉으로는 짜증과 분노, 이면에는 실망과 상처받은 자존감이 있습니다.<br>
    <b>갈등의 원인 요약</b>: 약속 시간을 어긴 상대방에 대한 신뢰 저하가 핵심입니다.<br>
    <b>상대방의 심리</b>: 방어적이거나 자기 입장을 먼저 이해받고 싶어할 수 있습니다.<br>
    <b>감정 영향 분석</b>: 짜증으로 인해 공격적인 언행이 발생하고 갈등이 격화됩니다.<br>
    <b>개선 방향</b>: "나는 서운했어"처럼 감정을 부드럽게 표현하는 것이 좋습니다.<br>

    다음 항목을 반드시 포함해주세요:
    - 표면 감정과 숨겨진 감정
    - 갈등의 핵심 원인 요약
    - 상대방의 가능성 있는 심리
    - 감정이 판단/행동에 미치는 영향
    - 개선 방향 요약 제안 (예: '나는' 화법, 공감적 표현 등)
    """

            
            response = self.client.chat.completions.create(
                model=self.gpt_model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"자세한 오류 내용: {e}")
            return f"갈등 상황 분석 중 오류가 발생했습니다: {str(e)}"
    
    def advanced_analysis(self, text: str, conflict_type: str) -> dict:
        """고급 AI 분석 - 감정, 관계, 소통 등 다면적 분석"""
        try:
            prompt = f"""
다음은 사용자가 작성한 갈등 상황입니다. 다면적으로 분석하여 JSON 형태로 결과를 제공해주세요.

갈등 상황: {text}
갈등 유형: {conflict_type}

다음 항목들을 분석하여 JSON으로 응답해주세요:

{{
  "emotion_analysis": "감정 상태 분석 (어떤 감정들이 관련되어 있는지, 감정의 강도 등)",
  "conflict_analysis": "갈등의 근본 원인과 구조적 분석",
  "relationship_health_score": 관계 건강도 점수 (1-100 숫자),
  "trust_score": {{
    "score": 신뢰도 점수 (1-100 숫자),  
    "analysis": "신뢰 관련 분석"
  }},
  "communication_score": 의사소통 점수 (1-100 숫자),
  "cooperation_score": {{
    "score": 협력도 점수 (1-100 숫자),
    "improvement_suggestions": ["협력 개선 방안1", "협력 개선 방안2"]
  }},
  "priority_recommendation": "HIGH|MEDIUM|LOW 중 하나",
  "recommended_actions": [
    "구체적인 행동 방안1",
    "구체적인 행동 방안2", 
    "구체적인 행동 방안3"
  ]
}}

응답은 반드시 유효한 JSON 형태로만 제공해주세요.
"""
            
            response = self.client.chat.completions.create(
                model=self.gpt_model,
                messages=[{"role": "user", "content": prompt}]
            )
            
            import json
            try:
                result = json.loads(response.choices[0].message.content.strip())
                return result
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 기본값 반환
                return {
                    "emotion_analysis": "감정 분석을 완료할 수 없습니다.",
                    "conflict_analysis": "갈등 분석을 완료할 수 없습니다.",
                    "relationship_health_score": 50,
                    "trust_score": {"score": 50, "analysis": "신뢰도 분석 불가"},
                    "communication_score": 50,
                    "cooperation_score": {"score": 50, "improvement_suggestions": ["분석 불가"]},
                    "priority_recommendation": "MEDIUM",
                    "recommended_actions": ["전문가 상담을 권장합니다."]
                }
                
        except Exception as e:
            print(f"고급 분석 오류: {e}")
            return {
                "emotion_analysis": f"감정 분석 중 오류: {str(e)}",
                "conflict_analysis": f"갈등 분석 중 오류: {str(e)}",
                "relationship_health_score": 50,
                "trust_score": {"score": 50, "analysis": "분석 오류"},
                "communication_score": 50,
                "cooperation_score": {"score": 50, "improvement_suggestions": ["분석 실패"]},
                "priority_recommendation": "MEDIUM",
                "recommended_actions": ["나중에 다시 시도해주세요."]
            }