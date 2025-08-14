import json
from redis import Redis
from datetime import datetime
from consumers.consumerBase import BaseKafkaConsumer

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class RoomMetricsConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="room-metrics", group_id="room-metrics-collector")

    def handle_message(self, message: str):
        try:
            data = json.loads(message)
            room_id = data["roomId"]
            participant_count = data["participantCount"]
            call_duration = data["callDuration"]
            conflict_level = data["conflictLevel"]
            timestamp = data["timestamp"]
            status = data.get("status", "active")
            total_messages = data.get("totalMessages", 0)
            avg_emotion_score = data.get("avgEmotionScore", 0.0)

            print(f"[룸 메트릭 수신] {room_id}: 참여자={participant_count}, 통화시간={call_duration}초, 갈등레벨={conflict_level}")

            # 실시간 룸 상태 저장 (최신 상태만 유지)
            room_status_key = f"room:status:{room_id}"
            room_status = {
                "participantCount": participant_count,
                "callDuration": call_duration,
                "conflictLevel": conflict_level,
                "status": status,
                "totalMessages": total_messages,
                "avgEmotionScore": avg_emotion_score,
                "lastUpdated": timestamp
            }
            r.hset(room_status_key, mapping=room_status)
            r.expire(room_status_key, 86400)  # 24시간 후 만료

            # 시간별 메트릭 히스토리 저장 (대시보드용)
            dt = datetime.fromisoformat(timestamp.replace('Z', ''))
            hour_key = dt.strftime("%Y-%m-%d:%H")
            metrics_key = f"room:metrics:{room_id}:{hour_key}"
            
            metrics_entry = {
                "timestamp": timestamp,
                "participantCount": participant_count,
                "callDuration": call_duration,
                "conflictLevel": conflict_level,
                "status": status,
                "totalMessages": total_messages,
                "avgEmotionScore": avg_emotion_score
            }
            r.rpush(metrics_key, json.dumps(metrics_entry))
            r.expire(metrics_key, 604800)  # 7일 후 만료

            # 전체 룸 통계 업데이트 (대시보드용)
            stats_key = "global:room:stats"
            r.hincrby(stats_key, "total_rooms", 1)
            r.hincrby(stats_key, "total_participants", participant_count)
            r.hincrby(stats_key, "total_call_duration", call_duration)
            r.expire(stats_key, 86400)

            # 파티션 정보 로깅 (Kafka 파티셔닝 모니터링용)
            partition_key = f"partition:room-metrics:{room_id}"
            partition_info = {
                "room_id": room_id,
                "processed_at": datetime.now().isoformat(),
                "message_count": r.incr(f"count:{partition_key}")
            }
            r.hset(partition_key, mapping=partition_info)
            r.expire(partition_key, 3600)  # 1시간 후 만료

            print(f"[룸 메트릭 저장 완료] {room_id}: 상태={status}, 메시지수={r.get(f'count:{partition_key}')}")

        except Exception as e:
            print(f"[룸 메트릭 컨슈머 오류] 메시지 처리 실패: {e}")
            print(f"[룸 메트릭 컨슈머 오류] 원본 메시지: {message}")

if __name__ == "__main__":
    consumer = RoomMetricsConsumer()
    consumer.init_consumer()
    consumer.start()