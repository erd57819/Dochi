import json
from redis import Redis
from datetime import datetime
from consumers.consumerBase import BaseKafkaConsumer

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class STTConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="conflict-stt", group_id="stt-collector")

    def handle_message(self, message: str):
        data = json.loads(message)
        room_id = data["roomId"]
        speaker = data["speakerId"]  # speakerId로 변경
        text = data["text"]
        timestamp = data["timestamp"]  # ISO8601 or Unix timestamp

        # 10분 단위 chunk index 계산
        if timestamp.endswith('Z'):
            timestamp = timestamp[:-1]  # Z 제거
        dt = datetime.fromisoformat(timestamp)
        chunk_index = dt.minute // 10

        # 10분 단위 청크 저장
        chunk_key = f"stt:transcript:{room_id}:{chunk_index}"
        line = f"{speaker}: {text}"
        r.rpush(chunk_key, line)
        print(f"[STT 청크 저장] {chunk_key} → {line}")
        
        # 전체 스크립트 저장 (갈등 레포트에서 사용)
        raw_key = f"stt:raw:{room_id}"
        r.rpush(raw_key, line)
        print(f"[STT 전체 저장] {raw_key} → {line}")

if __name__ == "__main__":
    STTConsumer().start()
