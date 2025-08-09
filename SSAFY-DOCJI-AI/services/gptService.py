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