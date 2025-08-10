from services.gptService import ask_gpt

def generate_summary(data, redis_client):
    room_id = data["roomId"]
    full_text = data["text"]

    prompt = f"""
    다음 대화를 요약해줘. 감정적인 흐름을 반영해 3~4줄로 정리하고, 마지막엔 대화의 핵심 감정 상태를 한 단어로 표현해줘.
    
    대화 내용:
    {full_text}
    """

    summary = ask_gpt(prompt)
    redis_client.set(f"stt:summary:{room_id}", summary)
    print(f"[요약 결과] {room_id} → {summary}")
