# consumers/roomMetricsConsumer.py
import json
import redis
from datetime import datetime
from consumers.consumerBase import BaseKafkaConsumer
from core.config import settings

# Redis 연결 (기존 연결과 동일)
try:
    r = redis.Redis(host="dochi-redis", port=6379, decode_responses=True)
    r.ping()  # 연결 테스트
    print("[Redis] RoomMetrics Consumer Redis 연결 성공")
except:
    print("[Redis] Redis 연결 실패 - localhost로 폴백")
    r = redis.Redis(host="localhost", port=6379, decode_responses=True)

class RoomMetricsConsumer(BaseKafkaConsumer):
    """
    방별 메트릭 Consumer
    기존 STT Consumer와 완전 분리된 새로운 확장성 데모용 Consumer
    """
    
    def __init__(self):
        super().__init__(topic="room-metrics", group_id="room-metrics-collector")
        self.processed_count = 0
        
        print(f"[RoomMetricsConsumer] 초기화 완료")
    
    def handle_message(self, message: str):
        """
        방 메트릭 메시지 처리
        Redis에 실시간 통계 저장 + 파티션 정보 로깅
        """
        try:
            data = json.loads(message)
            room_id = data.get("roomId", "unknown")
            participant_count = data.get("participantCount", 0)
            call_duration = data.get("callDurationSeconds", 0)
            conflict_level = data.get("conflictLevel", 0)
            timestamp = data.get("timestamp", datetime.now().isoformat())
            
            # 파티션 정보 (실제로는 msg.partition()에서 가져와야 하지만 데모용으로 계산)
            estimated_partition = abs(hash(room_id)) % 3
            
            # Redis에 실시간 통계 저장
            metrics_data = {
                "roomId": room_id,
                "participants": participant_count,
                "callDuration": call_duration,
                "conflictLevel": conflict_level,
                "lastActivity": timestamp,
                "status": "active",
                "partition": estimated_partition,
                "processedAt": datetime.now().isoformat(),
                "consumer": "RoomMetricsConsumer"
            }
            
            # 개별 방 통계 저장
            r.set(f"kafka:room:{room_id}", json.dumps(metrics_data), ex=3600)  # 1시간 TTL
            
            # 전체 통계 업데이트
            r.incr("kafka:metrics:total_rooms")
            r.set("kafka:metrics:last_update", datetime.now().isoformat())
            
            # 파티션별 통계
            r.incr(f"kafka:partition:{estimated_partition}:count")
            
            # 처리 통계
            self.processed_count += 1
            r.set("kafka:consumer:room_metrics:processed", self.processed_count)
            
            # 로깅 (파티션 정보 포함)
            print(f"[방 통계] {room_id} ({participant_count}명) → P{estimated_partition} "
                  f"| 갈등:{conflict_level}% | 진행:{call_duration//60}분 | 총처리:{self.processed_count}")
            
            # 특별한 경우 로깅
            if conflict_level > 80:
                print(f"⚠️  [높은 갈등] {room_id}: 갈등레벨 {conflict_level}% (주의 필요)")
            
            if participant_count >= 5:
                print(f"👥 [대형 방] {room_id}: {participant_count}명 참여 중")
                
        except json.JSONDecodeError as e:
            print(f"❌ [RoomMetrics] JSON 파싱 오류: {e}")
        except Exception as e:
            print(f"❌ [RoomMetrics] 메시지 처리 오류: {e}")
    
    def get_stats(self):
        """Consumer 통계 정보 반환"""
        try:
            total_rooms = r.get("kafka:metrics:total_rooms") or "0"
            last_update = r.get("kafka:metrics:last_update") or "없음"
            
            partition_stats = {}
            for i in range(3):  # 3개 파티션
                count = r.get(f"kafka:partition:{i}:count") or "0"
                partition_stats[f"partition_{i}"] = count
            
            return {
                "consumer_name": "RoomMetricsConsumer",
                "processed_messages": self.processed_count,
                "total_rooms": total_rooms,
                "last_update": last_update,
                "partition_distribution": partition_stats,
                "redis_connected": True
            }
        except Exception as e:
            return {
                "consumer_name": "RoomMetricsConsumer",
                "processed_messages": self.processed_count,
                "error": str(e),
                "redis_connected": False
            }