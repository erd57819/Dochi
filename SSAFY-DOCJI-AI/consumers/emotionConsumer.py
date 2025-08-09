import json
from redis import Redis
from datetime import datetime
from consumers.consumerBase import BaseKafkaConsumer
from services.emotionGraphService import update_emotion_graph

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class EmotionConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="conflict-emotion", group_id="emotion-collector")

    def handle_message(self, message: str):
        try:
            data = json.loads(message)
            room_id = data["roomId"]
            speaker = data["speaker"]
            timestamp = data["timestamp"]
            emotions = data["emotions"]  # {"dominant": "happy", "frequency": 5, "all": {...}}

            print(f"[감정 데이터 수신] {room_id} / {speaker}: {emotions}")

            # 감정 그래프 서비스를 통해 Redis에 저장
            update_emotion_graph(data, r)

            # 원시 감정 데이터도 저장 (백업용)
            raw_key = f"emotion:raw:{room_id}:{speaker}"
            emotion_entry = {
                "timestamp": timestamp,
                "emotions": emotions,
                "processedAt": data.get("processedAt")
            }
            r.rpush(raw_key, json.dumps(emotion_entry))
            
            print(f"[감정 저장 완료] {room_id}/{speaker}: {emotions['dominant']} (빈도: {emotions['frequency']})")

        except Exception as e:
            print(f"[감정 컨슈머 오류] 메시지 처리 실패: {e}")
            print(f"[감정 컨슈머 오류] 원본 메시지: {message}")

if __name__ == "__main__":
    EmotionConsumer().start()