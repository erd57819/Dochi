import os
import openai
from dotenv import load_dotenv

# GMS Key 환경변수에서 불러오기
openai.api_key = os.getenv("GMS_KEY")

# GMS용 BASE URL 설정
openai.base_url = "https://gms.ssafy.io/gmsapi/api.openai.com/v1"


client = OpenAI(
    api_key=openai.api_key,
    base_url=openai.base_url 
)

def ask_gpt(prompt: str, model: str = "gpt-4.1", temperature: float = 0.7) -> str:
    try:
        res = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "당신은 논리적이고 공감 능력 있는 갈등 해결 상담 전문가입니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_tokens=1000
        )
        return res.choices[0].message.content
    except Exception as e:
        print(f"[GPT ERROR] {e}")
        return "AI 응답을 불러오지 못했습니다."

def summarize_text(text: str) -> str:
    """
    대화 내용을 요약하는 함수
    """
    try:
        prompt = f"""
다음 대화 내용을 간결하고 핵심적으로 요약해주세요.

대화 내용:
{text}

다음 형식으로 요약해주세요:
1. 주요 주제: 
2. 핵심 내용:
3. 중요 포인트:
4. 전체 톤:

간결하고 명확하게 작성해주세요.
"""
        
        return ask_gpt(prompt, temperature=0.3)
    except Exception as e:
        print(f"[Text Summary ERROR] {e}")
        return f"요약 생성 실패: {str(e)}"