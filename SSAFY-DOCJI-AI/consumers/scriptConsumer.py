import json
import redis
from consumers.consumerBase import BaseKafkaConsumer

# Redis 연결
r = redis.Redis(host='dochi-redis', port=6379, decode_responses=True)

class ScriptConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="conflict-stt", group_id="stt-script")

    def handle_message(self, message: str):
        try:
            data = json.loads(message)
            room_id = data["roomId"]
            speaker = data["speakerId"]  # speakerId로 변경
            text = data["text"]

            key = f"stt:raw:{room_id}"
            value = f"{speaker}: {text}"

            r.rpush(key, value)
            print(f"[STT 저장] {key} ← {value}")

        except Exception as e:
            print(f"[오류] 메시지 처리 실패: {e}")

if __name__ == "__main__":
    ScriptConsumer().start()
