from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

GMS_KEY = os.getenv("GMS_KEY")
if not GMS_KEY:
    raise RuntimeError("GMS_KEY(또는 OPENAI_API_KEY) 환경변수를 설정하세요.")

# GMS 프록시로 BASE URL 설정
client = OpenAI(
    api_key=GMS_KEY,
    base_url="https://gms.ssafy.io/gmsapi/api.openai.com/v1",
)

def ask_gpt(prompt: str, model: str = "gpt-4.1", temperature: float = 0.7) -> str:
    """
    GMS 경유 OpenAI Responses API 호출
    """
    try:
        resp = client.responses.create(
            model=model,
            input=[
                {"role": "system", "content": "당신은 논리적이고 공감 능력 있는 갈등 해결 상담 전문가입니다."},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature,
            max_output_tokens=1000,
        )
        # SDK 편의 프로퍼티: 전체 텍스트 바로 추출
        return resp.output_text
    except Exception as e:
        print(f"[GPT ERROR] {e}")
        return "AI 응답을 불러오지 못했습니다."

def summarize_text(text: str) -> str:
    """
    대화 내용을 요약
    """
    try:
        prompt = (
            "다음 대화 내용을 간결하고 핵심적으로 요약해주세요.\n\n"
            "대화 내용:\n"
            f"{text}\n\n"
            "다음 형식으로 요약해주세요:\n"
            "1. 주요 주제:\n"
            "2. 핵심 내용:\n"
            "3. 중요 포인트:\n"
            "4. 전체 톤:\n\n"
            "간결하고 명확하게 작성해주세요."
        )
        return ask_gpt(prompt, temperature=0.3)
    except Exception as e:
        print(f"[Text Summary ERROR] {e}")
        return f"요약 생성 실패: {str(e)}"
