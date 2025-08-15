# consumers/userActivityConsumer.py
import json
import redis
from datetime import datetime
from consumers.consumerBase import BaseKafkaConsumer
from collections import defaultdict
from core.config import settings

# Redis 연결
try:
    r = redis.Redis(host="dochi-redis", port=6379, decode_responses=True)
    r.ping()
    print("[Redis] UserActivity Consumer Redis 연결 성공")
except:
    print("[Redis] Redis 연결 실패 - localhost로 폴백")
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)

class UserActivityConsumer(BaseKafkaConsumer):
    """
    사용자 활동 Consumer
    실시간 사용자 행동 패턴 분석 및 활동 로그 처리
    """
    
    def __init__(self):
        super().__init__(topic="user-activity", group_id="user-activity-collector")
        self.processed_count = 0
        self.activity_stats = defaultdict(int)  # 활동 유형별 통계
        
        print(f"[UserActivityConsumer] 초기화 완료")
    
    def handle_message(self, message: str):
        """
        사용자 활동 메시지 처리
        활동 패턴 분석 및 실시간 통계 생성
        """
        try:
            data = json.loads(message)
            room_id = data.get("roomId", "unknown")
            user_id = data.get("userId", "anonymous")
            activity_type = data.get("activityType", "UNKNOWN")
            emotion_state = data.get("emotionState", "NEUTRAL")
            timestamp = data.get("timestamp", datetime.now().isoformat())
            
            # 파티션 정보 계산
            estimated_partition = abs(hash(room_id)) % 3
            
            # 활동 통계 업데이트
            self.activity_stats[activity_type] += 1
            
            # Redis에 사용자 활동 저장
            activity_data = {
                "roomId": room_id,
                "userId": user_id,
                "activityType": activity_type,
                "emotionState": emotion_state,
                "timestamp": timestamp,
                "partition": estimated_partition,
                "processedAt": datetime.now().isoformat()
            }
            
            # 개별 활동 로그 저장 (최근 1000개만 유지)
            activity_key = f"kafka:activity:{room_id}"
            r.lpush(activity_key, json.dumps(activity_data))
            r.ltrim(activity_key, 0, 999)  # 최신 1000개만 유지
            r.expire(activity_key, 7200)  # 2시간 TTL
            
            # 사용자별 활동 통계
            user_stats_key = f"kafka:user:{user_id}:stats"
            r.hincrby(user_stats_key, activity_type, 1)
            r.expire(user_stats_key, 86400)  # 24시간 TTL
            
            # 감정 상태 통계
            emotion_key = f"kafka:emotion:{room_id}:{emotion_state}"
            r.incr(emotion_key)
            r.expire(emotion_key, 3600)  # 1시간 TTL
            
            # 전체 통계
            r.incr("kafka:activity:total_activities")
            r.incr(f"kafka:activity:type:{activity_type}")
            
            # 처리 카운트 업데이트
            self.processed_count += 1
            r.set("kafka:consumer:user_activity:processed", self.processed_count)
            
            # 로깅
            emotion_emoji = self._get_emotion_emoji(emotion_state)
            print(f"[사용자 활동] {user_id} → {activity_type} {emotion_emoji} "
                  f"in {room_id} (P{estimated_partition}) | 총처리:{self.processed_count}")
            
            # 특별한 활동 패턴 감지
            self._detect_patterns(room_id, user_id, activity_type, emotion_state)
            
        except json.JSONDecodeError as e:
            print(f"❌ [UserActivity] JSON 파싱 오류: {e}")
        except Exception as e:
            print(f"❌ [UserActivity] 메시지 처리 오류: {e}")
    
    def _get_emotion_emoji(self, emotion_state):
        """감정 상태에 따른 이모지 반환"""
        emotion_map = {
            "HAPPY": "😊",
            "SAD": "😢",
            "ANGRY": "😠",
            "NEUTRAL": "😐",
            "CONFUSED": "😕",
            "EXCITED": "🤩",
            "CALM": "😌"
        }
        return emotion_map.get(emotion_state, "❓")
    
    def _detect_patterns(self, room_id, user_id, activity_type, emotion_state):
        """활동 패턴 감지 및 알림"""
        try:
            # 감정 악화 패턴 감지
            if emotion_state in ["ANGRY", "SAD"]:
                recent_emotions = r.lrange(f"kafka:user:{user_id}:recent_emotions", 0, 4)
                negative_count = sum(1 for e in recent_emotions if e in ["ANGRY", "SAD"])
                
                if negative_count >= 3:
                    print(f"⚠️  [패턴 감지] {user_id}: 부정적 감정 지속 (방: {room_id})")
            
            # 참여도 패턴 감지
            if activity_type == "SPEAK":
                recent_speak_count = r.get(f"kafka:user:{user_id}:speak_count") or "0"
                if int(recent_speak_count) > 10:
                    print(f"🗣️  [활발한 참여] {user_id}: 발언 {recent_speak_count}회 (방: {room_id})")
            
            # 감정 상태 히스토리 업데이트 (최근 5개만)
            r.lpush(f"kafka:user:{user_id}:recent_emotions", emotion_state)
            r.ltrim(f"kafka:user:{user_id}:recent_emotions", 0, 4)
            r.expire(f"kafka:user:{user_id}:recent_emotions", 3600)
            
        except Exception as e:
            print(f"❌ [패턴 감지 오류] {e}")
    
    def get_stats(self):
        """Consumer 통계 정보 반환"""
        try:
            total_activities = r.get("kafka:activity:total_activities") or "0"
            
            # 활동 유형별 통계
            activity_breakdown = {}
            for activity_type, count in self.activity_stats.items():
                activity_breakdown[activity_type] = count
            
            # 최근 감정 분포
            emotion_distribution = {}
            for emotion in ["HAPPY", "SAD", "ANGRY", "NEUTRAL", "CONFUSED"]:
                pattern = f"kafka:emotion:*:{emotion}"
                keys = r.keys(pattern)
                total = sum(int(r.get(key) or 0) for key in keys)
                emotion_distribution[emotion] = total
            
            return {
                "consumer_name": "UserActivityConsumer",
                "processed_messages": self.processed_count,
                "total_activities": total_activities,
                "activity_breakdown": activity_breakdown,
                "emotion_distribution": emotion_distribution,
                "redis_connected": True
            }
        except Exception as e:
            return {
                "consumer_name": "UserActivityConsumer",
                "processed_messages": self.processed_count,
                "error": str(e),
                "redis_connected": False
            }