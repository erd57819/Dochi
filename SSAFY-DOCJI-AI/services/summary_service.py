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

    def summarize(self, text: str) -> str:
        try:
            # 갈등 분석에 특화된 프롬프트
            prompt = f"""
다음은 사용자가 작성한 갈등 상황입니다. 이를 분석하여 한글로 요약해주세요.

갈등 상황:
{text}

다음 관점에서 요약해주세요:
1. 갈등의 핵심 내용과 원인
2. 관련된 감정이나 심리적 요소
3. 갈등의 복잡성 정도
4. 해결을 위해 필요한 주요 접근 방향

요약은 3-4문장으로 간결하고 공감적인 톤으로 작성해주세요.
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