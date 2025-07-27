# app/services/summary_service.py

from ..core.config import settings
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
            prompt = f"다음 텍스트를 한글로 요약해줘: {text}"
            # self.client를 사용하여 API 호출
            response = self.client.chat.completions.create(
                model=self.gpt_model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"자세한 오류 내용: {e}")
            return f"API 오류가 발생했습니다: {str(e)}"