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