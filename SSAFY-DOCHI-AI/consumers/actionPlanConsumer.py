import json
from redis import Redis
from consumers.consumerBase import BaseKafkaConsumer
from services.actionPlanService import generate_action_plan

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class ActionPlanConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="STT-transcripts", group_id="action-plan")

    def handle_message(self, message: str):
        data = json.loads(message)
        generate_action_plan(data, r)

if __name__ == "__main__":
    ActionPlanConsumer().start()
