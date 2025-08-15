# monitoring/realTimeMonitor.py
import json
import redis
import time
import sys
import threading
from datetime import datetime
from collections import defaultdict, deque
import os

# Redis 연결
try:
    r = redis.Redis(host="dochi-redis", port=6379, decode_responses=True)
    r.ping()
    print("✅ [Monitor] Redis 연결 성공")
except:
    try:
        r = redis.Redis(host="localhost", port=6379, decode_responses=True)
        r.ping()
        print("✅ [Monitor] Redis 연결 성공 (localhost)")
    except:
        print("❌ [Monitor] Redis 연결 실패")
        sys.exit(1)

class KafkaRealTimeMonitor:
    """
    Kafka 메트릭 실시간 모니터링 도구
    파티션 분산, 처리량, Consumer 상태 등을 실시간으로 표시
    """
    
    def __init__(self):
        self.start_time = time.time()
        self.stats_history = deque(maxlen=60)  # 최근 60초간의 통계
        self.partition_stats = defaultdict(int)
        self.room_distribution = defaultdict(list)
        
        # 터미널 제어
        self.clear_screen()
        
    def clear_screen(self):
        """터미널 화면 지우기"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def get_current_stats(self):
        """현재 Redis에서 통계 수집"""
        try:
            stats = {
                'timestamp': datetime.now().strftime('%H:%M:%S'),
                'active_rooms': 0,
                'total_participants': 0,
                'partition_distribution': {0: 0, 1: 0, 2: 0},
                'consumer_processed': {},
                'recent_activities': [],
                'room_details': []
            }
            
            # 활성 방 정보 수집
            room_keys = r.keys("kafka:room:*")
            active_rooms = []
            
            for key in room_keys:
                room_data = r.get(key)
                if room_data:
                    try:
                        data = json.loads(room_data)
                        room_id = data.get('roomId', 'unknown')
                        participants = data.get('participants', 0)
                        partition = data.get('partition', 0)
                        conflict_level = data.get('conflictLevel', 0)
                        
                        active_rooms.append({
                            'roomId': room_id,
                            'participants': participants,
                            'partition': partition,
                            'conflictLevel': conflict_level,
                            'lastActivity': data.get('lastActivity', 'unknown')
                        })
                        
                        stats['active_rooms'] += 1
                        stats['total_participants'] += participants
                        stats['partition_distribution'][partition] += 1
                        
                    except json.JSONDecodeError:
                        continue
            
            stats['room_details'] = active_rooms
            
            # Consumer 처리 통계
            room_consumer_processed = r.get("kafka:consumer:room_metrics:processed") or "0"
            activity_consumer_processed = r.get("kafka:consumer:user_activity:processed") or "0"
            
            stats['consumer_processed'] = {
                'room_metrics': int(room_consumer_processed),
                'user_activity': int(activity_consumer_processed)
            }
            
            # 전체 통계
            total_rooms = r.get("kafka:metrics:total_rooms") or "0"
            total_activities = r.get("kafka:activity:total_activities") or "0"
            
            stats['total_processed_rooms'] = int(total_rooms)
            stats['total_activities'] = int(total_activities)
            
            return stats
            
        except Exception as e:
            print(f"❌ [Monitor] 통계 수집 오류: {e}")
            return None
    
    def calculate_throughput(self):
        """처리량 계산"""
        if len(self.stats_history) < 2:
            return 0
        
        recent = self.stats_history[-1]
        previous = self.stats_history[-2]
        
        room_diff = recent['consumer_processed']['room_metrics'] - previous['consumer_processed']['room_metrics']
        activity_diff = recent['consumer_processed']['user_activity'] - previous['consumer_processed']['user_activity']
        
        return room_diff + activity_diff
    
    def draw_partition_chart(self, partition_dist):
        """파티션 분산 차트 그리기"""
        max_val = max(partition_dist.values()) if partition_dist.values() else 1
        chart_width = 40
        
        print("📊 파티션별 방 분산")
        print("-" * 60)
        
        for partition in range(3):
            count = partition_dist.get(partition, 0)
            bar_length = int((count / max_val) * chart_width) if max_val > 0 else 0
            percentage = (count / sum(partition_dist.values()) * 100) if sum(partition_dist.values()) > 0 else 0
            
            bar = "█" * bar_length + "░" * (chart_width - bar_length)
            print(f"P{partition}: {bar} {count:2d}개 ({percentage:4.1f}%)")
    
    def draw_activity_chart(self):
        """최근 처리량 차트 그리기"""
        print("\n📈 처리량 추이 (최근 10초)")
        print("-" * 60)
        
        if len(self.stats_history) < 2:
            print("데이터 수집 중...")
            return
        
        recent_throughput = []
        for i in range(max(1, len(self.stats_history) - 10), len(self.stats_history)):
            if i > 0:
                current = self.stats_history[i]
                previous = self.stats_history[i-1]
                
                room_diff = current['consumer_processed']['room_metrics'] - previous['consumer_processed']['room_metrics']
                activity_diff = current['consumer_processed']['user_activity'] - previous['consumer_processed']['user_activity']
                
                recent_throughput.append(room_diff + activity_diff)
        
        if not recent_throughput:
            print("처리량 데이터 없음")
            return
        
        max_throughput = max(recent_throughput) if recent_throughput else 1
        chart_width = 50
        
        for i, throughput in enumerate(recent_throughput):
            bar_length = int((throughput / max_throughput) * chart_width) if max_throughput > 0 else 0
            bar = "▓" * bar_length
            timestamp = f"-{len(recent_throughput)-i}s"
            print(f"{timestamp:4s}: {bar:<50} {throughput} msg/s")
    
    def display_dashboard(self, stats):
        """대시보드 메인 화면 표시"""
        uptime = int(time.time() - self.start_time)
        throughput = self.calculate_throughput()
        
        # 헤더
        print("🚀 참견도치 Kafka 실시간 모니터링 대시보드")
        print("=" * 70)
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | ⏱️  가동시간: {uptime//60}:{uptime%60:02d}")
        print("=" * 70)
        
        # 주요 지표
        print("📊 실시간 처리 현황")
        print("-" * 70)
        print(f"🏠 활성 방 개수        │ {stats['active_rooms']:>6}개")
        print(f"👥 총 참가자 수        │ {stats['total_participants']:>6}명")
        print(f"⚡ 현재 처리량         │ {throughput:>6} msg/s")
        print(f"📈 총 처리된 방        │ {stats['total_processed_rooms']:>6}개")
        print(f"🔄 총 활동 기록        │ {stats['total_activities']:>6}개")
        
        # 파티션 분산 차트
        print("\n")
        self.draw_partition_chart(stats['partition_distribution'])
        
        # Consumer 상태
        print("\n🔄 Consumer 처리 상태")
        print("-" * 70)
        for consumer_name, processed in stats['consumer_processed'].items():
            status = "🟢 정상" if processed > 0 else "🔴 대기"
            print(f"{consumer_name:<20} │ {status} │ 처리: {processed:>6}개")
        
        # 활성 방 상세 정보
        print("\n🏠 활성 방 상세 정보")
        print("-" * 70)
        if stats['room_details']:
            for room in stats['room_details'][:10]:  # 최대 10개만 표시
                conflict_emoji = "🔥" if room['conflictLevel'] > 70 else "⚠️" if room['conflictLevel'] > 40 else "😊"
                print(f"{room['roomId']:<15} │ {room['participants']:2d}명 │ P{room['partition']} │ {conflict_emoji} {room['conflictLevel']:2d}%")
        else:
            print("현재 활성 방이 없습니다.")
        
        # 처리량 차트
        self.draw_activity_chart()
        
        # 하단 정보
        print("\n" + "=" * 70)
        print("💡 실시간 업데이트 중... (Ctrl+C로 종료)")
        print("🔍 Kafka 토픽: room-metrics, user-activity")
        print("🎯 파티션 전략: roomId 기반 해시 분산")
    
    def run_monitor(self, refresh_interval=2):
        """모니터링 메인 루프"""
        print("🚀 [Monitor] Kafka 실시간 모니터링 시작...")
        
        try:
            while True:
                stats = self.get_current_stats()
                if stats:
                    self.stats_history.append(stats)
                    
                    # 화면 지우고 새로 그리기
                    self.clear_screen()
                    self.display_dashboard(stats)
                else:
                    print("❌ [Monitor] 통계 수집 실패")
                
                time.sleep(refresh_interval)
                
        except KeyboardInterrupt:
            print("\n\n👋 [Monitor] 모니터링 종료")
        except Exception as e:
            print(f"\n❌ [Monitor] 오류 발생: {e}")

def main():
    """메인 실행 함수"""
    monitor = KafkaRealTimeMonitor()
    
    # 사용법 안내
    print("🎯 Kafka 실시간 모니터링 도구")
    print("=" * 50)
    print("📌 기능:")
    print("  - 실시간 방 통계 모니터링")
    print("  - 파티션별 분산 현황")
    print("  - Consumer 처리 상태")
    print("  - 처리량 추이 분석")
    print("\n⏳ 3초 후 모니터링 시작...")
    
    for i in range(3, 0, -1):
        print(f"⏰ {i}초...")
        time.sleep(1)
    
    monitor.run_monitor()

if __name__ == "__main__":
    main()