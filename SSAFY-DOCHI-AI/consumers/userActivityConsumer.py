import json
from redis import Redis
from datetime import datetime
from consumers.consumerBase import BaseKafkaConsumer

r = Redis(host="dochi-redis", port=6379, decode_responses=True)

class UserActivityConsumer(BaseKafkaConsumer):
    def __init__(self):
        super().__init__(topic="user-activity", group_id="user-activity-collector")

    def handle_message(self, message: str):
        try:
            data = json.loads(message)
            user_id = data["userId"]
            room_id = data["roomId"]
            activity_type = data["activityType"]
            timestamp = data["timestamp"]
            session_id = data.get("sessionId")
            emotion_type = data.get("emotionType")
            message_length = data.get("messageLength")
            speak_duration = data.get("speakDuration")

            print(f"[사용자 활동 수신] {user_id}@{room_id}: {activity_type}")

            # 사용자별 활동 로그 저장
            user_activity_key = f"user:activity:{user_id}:{room_id}"
            activity_entry = {
                "activityType": activity_type,
                "timestamp": timestamp,
                "sessionId": session_id,
                "emotionType": emotion_type,
                "messageLength": message_length,
                "speakDuration": speak_duration
            }
            r.rpush(user_activity_key, json.dumps(activity_entry))
            r.expire(user_activity_key, 604800)  # 7일 후 만료

            # 룸별 활동 통계 업데이트
            room_activity_key = f"room:activity:stats:{room_id}"
            r.hincrby(room_activity_key, f"total_{activity_type}", 1)
            r.hset(room_activity_key, "last_activity", timestamp)
            r.expire(room_activity_key, 86400)  # 24시간 후 만료

            # 활동 타입별 세부 처리
            if activity_type == "join":
                # 참여자 수 증가
                r.hincrby(f"room:status:{room_id}", "participantCount", 1)
                
            elif activity_type == "leave":
                # 참여자 수 감소
                current_count = r.hget(f"room:status:{room_id}", "participantCount")
                if current_count and int(current_count) > 0:
                    r.hincrby(f"room:status:{room_id}", "participantCount", -1)
                    
            elif activity_type == "speak" and speak_duration:
                # 발화 시간 통계
                speak_stats_key = f"room:speak:stats:{room_id}"
                r.hincrby(speak_stats_key, "total_speak_duration", speak_duration)
                r.hincrby(speak_stats_key, "total_speak_count", 1)
                if emotion_type:
                    r.hincrby(speak_stats_key, f"emotion_{emotion_type}", 1)
                r.expire(speak_stats_key, 86400)
                
            elif activity_type == "emotion_detected" and emotion_type:
                # 감정 통계
                emotion_stats_key = f"room:emotion:stats:{room_id}"
                r.hincrby(emotion_stats_key, f"emotion_{emotion_type}", 1)
                r.hincrby(emotion_stats_key, "total_emotions", 1)
                r.expire(emotion_stats_key, 86400)
                
            elif activity_type == "message_sent" and message_length:
                # 메시지 통계
                message_stats_key = f"room:message:stats:{room_id}"
                r.hincrby(message_stats_key, "total_messages", 1)
                r.hincrby(message_stats_key, "total_message_length", message_length)
                r.expire(message_stats_key, 86400)

            # 시간별 활동 히스토리 (대시보드용)
            dt = datetime.fromisoformat(timestamp.replace('Z', ''))
            hour_key = dt.strftime("%Y-%m-%d:%H")
            activity_history_key = f"room:activity:{room_id}:{hour_key}"
            
            activity_summary = {
                "timestamp": timestamp,
                "userId": user_id,
                "activityType": activity_type,
                "emotionType": emotion_type,
                "duration": speak_duration or message_length or 0
            }
            r.rpush(activity_history_key, json.dumps(activity_summary))
            r.expire(activity_history_key, 604800)  # 7일 후 만료

            # 파티션 정보 로깅 (Kafka 파티셔닝 모니터링용)
            partition_key = f"partition:user-activity:{room_id}"
            partition_info = {
                "room_id": room_id,
                "user_id": user_id,
                "activity_type": activity_type,
                "processed_at": datetime.now().isoformat(),
                "message_count": r.incr(f"count:{partition_key}")
            }
            r.hset(partition_key, mapping=partition_info)
            r.expire(partition_key, 3600)  # 1시간 후 만료

            # 전체 사용자 활동 통계 업데이트
            global_stats_key = "global:user:stats"
            r.hincrby(global_stats_key, f"total_{activity_type}", 1)
            r.hincrby(global_stats_key, "total_activities", 1)
            r.expire(global_stats_key, 86400)

            print(f"[사용자 활동 저장 완료] {user_id}@{room_id}: {activity_type}, 파티션 메시지수={r.get(f'count:{partition_key}')}")

        except Exception as e:
            print(f"[사용자 활동 컨슈머 오류] 메시지 처리 실패: {e}")
            print(f"[사용자 활동 컨슈머 오류] 원본 메시지: {message}")

if __name__ == "__main__":
    consumer = UserActivityConsumer()
    consumer.init_consumer()
    consumer.start()