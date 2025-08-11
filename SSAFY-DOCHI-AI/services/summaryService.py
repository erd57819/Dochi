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

    # 기본 분석 메서드 제거됨 - 통합 분석(advanced_analysis)으로 대체
    def advanced_analysis(self, text: str, conflict_type: str) -> dict:
        """통합 AI 분석 - 기본 요약과 고급 분석을 한번에 처리"""
        try:
            prompt = f"""
당신은 갈등 해결 전문가입니다. 다음 갈등 상황을 심층 분석하여 HTML 형태로 잘 포맷된 결과를 JSON으로 제공해주세요.

갈등 상황: {text}
갈등 유형: {conflict_type}

다음 항목들을 HTML 태그를 사용해 보기 좋게 분석하여 JSON으로 응답해주세요:

{{
  "emotion_analysis": "HTML 형태로 포맷된 감정 분석 결과. <b>표면 감정:</b> 현재 드러나는 감정들을 구체적으로 분석. <br><br><b>숨겨진 감정:</b> 표현되지 않은 깊은 감정들을 분석. <br><br><b>감정적 영향:</b> 이 감정들이 관계와 당사자에게 미치는 구체적 영향을 상세히 설명",
  "conflict_analysis": "HTML 형태로 포맷된 갈등 분석 결과. <b>즉각적 원인:</b> 갈등을 촉발한 직접적인 사건이나 행동을 구체적으로 분석. <br><br><b>근본적 원인:</b> 갈등의 뿌리가 되는 깊은 원인들을 심층 분석 (가치관 차이, 의사소통 패턴, 기대치 불일치 등). <br><br><b>반복 패턴:</b> 이런 갈등이 반복되는 구조적 문제점과 악순환 고리를 상세히 설명",
  "my_position": "HTML 형태로 포맷된 내 입장 분석. <b>심리적 입장:</b> 갈등 당사자의 현재 심리 상태, 감정, 관점을 구체적으로 분석. <br><br><b>핵심 니즈:</b> 진짜 원하는 것이 무엇인지, 충족되지 않은 욕구가 무엇인지 깊이 있게 분석",
  "partner_position": "HTML 형태로 포맷된 상대방 입장 분석. <b>심리적 상태:</b> 상대방이 처한 상황, 느낄 수 있는 감정, 관점을 공감적으로 분석. <br><br><b>가능한 관점:</b> 상대방이 이 상황을 어떻게 해석하고 있을지, 어떤 이유로 그런 행동을 하는지 다각도로 분석",
  "relationship_health_score": 관계 건강도 점수 (1-100 숫자),
  "trust_score": {{
    "score": 신뢰도 점수 (1-100 숫자),  
    "analysis": "HTML 형태로 포맷된 신뢰 분석. <b>현재 신뢰 수준:</b> 관계의 신뢰도 상태. <br><b>손상된 부분:</b> 어떤 부분에서 신뢰가 깨졌는지. <br><b>회복 방안:</b> 신뢰를 다시 쌓기 위한 구체적 방법"
  }},
  "communication_score": 의사소통 점수 (1-100 숫자),
  "cooperation_score": {{
    "score": 협력도 점수 (1-100 숫자),
    "improvement_suggestions": ["구체적인 협력 개선 방안1", "구체적인 협력 개선 방안2", "구체적인 협력 개선 방안3"]
  }},
  "priority_recommendation": "갈등 해결의 우선순위 (HIGH|MEDIUM|LOW)",
  "recommended_actions": {{
    "immediate": ["지금 당장 실행 가능한 구체적 행동1", "지금 당장 실행 가능한 구체적 행동2"],
    "shortTerm": ["1-2주 내 실행할 구체적 행동1", "1-2주 내 실행할 구체적 행동2"],
    "midTerm": ["1-3개월 지속할 구체적 행동1", "1-3개월 지속할 구체적 행동2"],
    "longTerm": ["장기적 예방을 위한 구체적 행동1", "장기적 예방을 위한 구체적 행동2"],
    "alternative": ["다른 방법이 통하지 않을 때의 구체적 대안1", "다른 방법이 통하지 않을 때의 구체적 대안2"]
  }}
}}

중요 지침: 
1. emotion_analysis, conflict_analysis, my_position, partner_position은 반드시 HTML 태그를 사용한 문자열로 제공
2. <b>제목:</b> 형태로 각 섹션을 구분하고, <br><br> 태그로 단락 구분
3. 각 분석은 3-4문장의 구체적이고 상세한 설명 포함
4. 모든 내용은 전문가 수준의 깊이 있는 분석이어야 함
5. 응답은 반드시 유효한 JSON 형태로만 제공
"""
            
            response = self.client.chat.completions.create(
                model=self.gpt_model,
                messages=[{"role": "user", "content": prompt}]
            )
            
            import json
            response_text = response.choices[0].message.content.strip()
            print(f"[AI Response] 원본 응답: {response_text[:500]}...")  # 처음 500자만 로깅
            
            # 코드 블록 제거 (```json ... ``` 형태 처리)
            if response_text.startswith("```json"):
                response_text = response_text[7:]  # ```json 제거
            elif response_text.startswith("```"):
                response_text = response_text[3:]  # ``` 제거
            
            if response_text.endswith("```"):
                response_text = response_text[:-3]  # 끝의 ``` 제거
            
            response_text = response_text.strip()
            
            try:
                result = json.loads(response_text)
                print(f"[AI Response] JSON 파싱 성공, 키: {result.keys()}")
                return result
            except json.JSONDecodeError as je:
                # JSON 파싱 실패 시 기본값 반환
                print(f"[AI Response] JSON 파싱 실패: {je}")
                print(f"[AI Response] 파싱 실패한 텍스트 일부: {response_text[:200]}")
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