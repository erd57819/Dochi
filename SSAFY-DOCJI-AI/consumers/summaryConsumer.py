# consumers/summary_consumer.py

import json
import redis
from consumers.consumer_base import BaseKafkaConsumer
from services.gpt_service import summarize_text  # 추후 구현 필요

r = redis.Redis(host='dochi-redis', port=6379, decode_responses=True)

class SummaryConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="STT-transcripts", group_id="stt-summary")

    def handle_message(self, message: str):
        try:
            data = json.loads(message)
            room_id = data["roomId"]

            key = f"stt:raw:{room_id}"
            length = r.llen(key)

            
            if length % 10 == 0:
                raw_list = r.lrange(key, 0, length - 1)
                full_text = "\n".join(raw_list)

                summary = summarize_text(full_text)  # GPT 요약 함수 연동

                summary_key = f"stt:summary:{room_id}"
                r.set(summary_key, summary)

                print(f"[요약 저장] {summary_key} ← {summary[:100]}...")

        except Exception as e:
            print(f"[요약 오류] {e}")

if __name__ == "__main__":
    SummaryConsumer().start()
