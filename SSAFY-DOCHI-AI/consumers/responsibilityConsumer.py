import json
from redis import Redis
from consumers.consumerBase import BaseKafkaConsumer
from services.responsibilityService import analyze_responsibility

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class ResponsibilityConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="responsibility-chunk", group_id="responsibility-analyzer")

    def handle_message(self, message: str):
        data = json.loads(message)
        room_id = data["roomId"]
        chunk_index = data["chunkIndex"]
        transcript = data["transcript"]

        result = analyze_responsibility(transcript)

        key = f"responsibility:{room_id}:{chunk_index}"
        r.set(key, json.dumps(result))
        print(f"[책임 분석] {key} → {result}")

if __name__ == "__main__":
    ResponsibilityConsumer().start()
