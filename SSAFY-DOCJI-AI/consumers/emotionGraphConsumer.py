import json
from redis import Redis
from consumers.consumer_base import BaseKafkaConsumer
from services.emotionGraphService import update_emotion_graph

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class EmotionGraphConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="face-emotion", group_id="emotion-graph")

    def handle_message(self, message: str):
        data = json.loads(message)
        update_emotion_graph(data, r)

if __name__ == "__main__":
    EmotionGraphConsumer().start()
