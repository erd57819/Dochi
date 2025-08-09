from services.gptService import ask_gpt
import json

def analyze_responsibility(transcript: str) -> dict:
    prompt = f"""
다음 대화 내용을 읽고 각 발화자가 갈등에 영향을 준 책임 비율을 100% 기준으로 산정해줘. JSON 형태로 응답해.
갈등을 일으킨 쪽의 책임이 더 높아야 합니다.
예시:
{{ "user1": 60, "user2": 40 }}

대화:
{transcript}
"""
    response = ask_gpt(prompt, temperature=0.3)

    try:
        return json.loads(response)
    except:
        print("[GPT 응답 파싱 실패]", response)
        return {}
