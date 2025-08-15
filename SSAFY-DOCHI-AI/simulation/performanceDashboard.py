# simulation/performanceDashboard.py
import json
import redis
import time
import threading
import sys
from datetime import datetime, timedelta
from collections import defaultdict, deque
import statistics
import os

# Redis 연결
try:
    r = redis.Redis(host="dochi-redis", port=6379, decode_responses=True)
    r.ping()
    print("✅ [Dashboard] Redis 연결 성공")
except:
    try:
        r = redis.Redis(host="localhost", port=6379, decode_responses=True)
        r.ping() 
        print("✅ [Dashboard] Redis 연결 성공 (localhost)")
    except:
        print("❌ [Dashboard] Redis 연결 실패")
        sys.exit(1)

class PerformanceDashboard:
    """
    Kafka 성능 분석 대시보드
    실시간 메트릭 분석, 확장성 평가, 예측 모델링
    """
    
    def __init__(self):
        self.start_time = time.time()
        self.metrics_history = deque(maxlen=300)  # 5분간 데이터 (1초씩)
        self.throughput_history = deque(maxlen=60)  # 1분간 처리량
        self.partition_efficiency = defaultdict(list)
        self.consumer_health = defaultdict(dict)
        
        # 성능 임계값
        self.thresholds = {
            'throughput_excellent': 200,    # msg/s
            'throughput_good': 100,
            'throughput_warning': 50,
            'response_time_good': 50,       # ms
            'response_time_warning': 100,
            'partition_balance_good': 0.8   # 파티션 간 균형도
        }
        
    def clear_screen(self):
        """화면 지우기"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def collect_metrics(self):
        """Redis에서 메트릭 수집"""
        try:
            # 기본 메트릭
            metrics = {
                'timestamp': time.time(),
                'active_rooms': 0,
                'total_participants': 0,
                'partition_stats': {0: 0, 1: 0, 2: 0},
                'consumer_stats': {},
                'room_details': [],
                'conflict_distribution': defaultdict(int),
                'participant_distribution': defaultdict(int)
            }
            
            # 활성 방 데이터 수집
            room_keys = r.keys("kafka:room:*")
            for key in room_keys:
                room_data = r.get(key)
                if room_data:
                    try:
                        data = json.loads(room_data)
                        room_id = data.get('roomId', 'unknown')
                        participants = data.get('participants', 0)
                        conflict_level = data.get('conflictLevel', 0)
                        partition = data.get('partition', 0)
                        
                        metrics['active_rooms'] += 1
                        metrics['total_participants'] += participants
                        metrics['partition_stats'][partition] += 1
                        
                        # 갈등 레벨 분포
                        conflict_bucket = (conflict_level // 20) * 20  # 0-19 -> 0, 20-39 -> 20, ...
                        metrics['conflict_distribution'][conflict_bucket] += 1
                        
                        # 참가자 수 분포
                        metrics['participant_distribution'][participants] += 1
                        
                        metrics['room_details'].append({
                            'roomId': room_id,
                            'participants': participants,
                            'conflictLevel': conflict_level,
                            'partition': partition
                        })
                        
                    except json.JSONDecodeError:
                        continue
            
            # Consumer 통계
            metrics['consumer_stats'] = {
                'room_metrics': int(r.get("kafka:consumer:room_metrics:processed") or 0),
                'user_activity': int(r.get("kafka:consumer:user_activity:processed") or 0)
            }
            
            # 전체 통계
            metrics['total_processed_rooms'] = int(r.get("kafka:metrics:total_rooms") or 0)
            metrics['total_activities'] = int(r.get("kafka:activity:total_activities") or 0)
            
            return metrics
            
        except Exception as e:
            print(f"❌ [Dashboard] 메트릭 수집 오류: {e}")
            return None
    
    def calculate_performance_indicators(self):
        """성능 지표 계산"""
        if len(self.metrics_history) < 2:
            return {}
        
        current = self.metrics_history[-1]
        previous = self.metrics_history[-2]
        
        # 처리량 계산
        throughput = 0
        for consumer, count in current['consumer_stats'].items():
            prev_count = previous['consumer_stats'].get(consumer, 0)
            throughput += max(0, count - prev_count)
        
        # 파티션 균형도 계산
        partition_counts = list(current['partition_stats'].values())
        if sum(partition_counts) > 0:
            avg_partition = sum(partition_counts) / len(partition_counts)
            partition_balance = 1.0 - (max(partition_counts) - min(partition_counts)) / (avg_partition + 1)
        else:
            partition_balance = 1.0
        
        # 예상 확장성 계산
        current_load = current['active_rooms']
        if current_load > 0:
            # 현재 파티션 구성으로 처리 가능한 최대 방 수 추정
            estimated_capacity = min(300, current_load * (throughput / max(1, current_load)) * 3)
        else:
            estimated_capacity = 300
        
        return {
            'throughput': throughput,
            'partition_balance': partition_balance,
            'estimated_capacity': int(estimated_capacity),
            'load_percentage': (current_load / estimated_capacity * 100) if estimated_capacity > 0 else 0
        }
    
    def get_performance_grade(self, indicators):
        """성능 등급 평가"""
        throughput = indicators.get('throughput', 0)
        balance = indicators.get('partition_balance', 0)
        load_pct = indicators.get('load_percentage', 0)
        
        # 점수 계산 (100점 만점)
        throughput_score = min(100, throughput / self.thresholds['throughput_excellent'] * 100)
        balance_score = balance * 100
        load_score = max(0, 100 - load_pct)  # 부하가 낮을수록 좋음
        
        total_score = (throughput_score * 0.4 + balance_score * 0.3 + load_score * 0.3)
        
        if total_score >= 90:
            return "A+", "🟢 우수", total_score
        elif total_score >= 80:
            return "A", "🟢 양호", total_score
        elif total_score >= 70:
            return "B", "🟡 보통", total_score
        elif total_score >= 60:
            return "C", "🟠 주의", total_score
        else:
            return "D", "🔴 개선필요", total_score
    
    def draw_ascii_chart(self, data, title, max_width=50):
        """ASCII 차트 그리기"""
        if not data:
            return
        
        print(f"\n📊 {title}")
        print("-" * 60)
        
        max_val = max(data.values()) if data.values() else 1
        
        for key, value in sorted(data.items()):
            bar_length = int((value / max_val) * max_width) if max_val > 0 else 0
            percentage = (value / sum(data.values()) * 100) if sum(data.values()) > 0 else 0
            
            bar = "█" * bar_length + "░" * (max_width - bar_length)
            print(f"{str(key):>10}: {bar} {value:4d} ({percentage:4.1f}%)")
    
    def draw_throughput_trend(self):
        """처리량 추이 그래프"""
        if len(self.throughput_history) < 2:
            print("\n📈 처리량 추이: 데이터 수집 중...")
            return
        
        print("\n📈 처리량 추이 (최근 30초)")
        print("-" * 60)
        
        # 최근 30개 데이터점 사용
        recent_data = list(self.throughput_history)[-30:]
        max_throughput = max(recent_data) if recent_data else 1
        chart_height = 10
        
        # 세로 차트 그리기
        for level in range(chart_height, 0, -1):
            line = f"{max_throughput * level / chart_height:6.0f} │"
            
            for throughput in recent_data:
                if throughput >= (max_throughput * level / chart_height):
                    line += "▓"
                else:
                    line += " "
            
            print(line)
        
        # X축
        print("      └" + "─" * len(recent_data))
        print("       " + " " * (len(recent_data)//2) + "시간 →")
    
    def predict_scaling_requirements(self, target_rooms):
        """확장 요구사항 예측"""
        current_metrics = self.metrics_history[-1] if self.metrics_history else {}
        current_rooms = current_metrics.get('active_rooms', 0)
        
        if current_rooms == 0:
            return {
                'target_rooms': target_rooms,
                'recommended_partitions': 10,
                'recommended_consumers': 10,
                'estimated_throughput': target_rooms * 2,
                'confidence': 'Low (시뮬레이션 필요)'
            }
        
        # 현재 성능 기반 예측
        indicators = self.calculate_performance_indicators()
        current_throughput = indicators.get('throughput', 1)
        
        # 확장 비율 계산
        scale_factor = target_rooms / max(1, current_rooms)
        
        # 파티션 수 추천 (방 수의 1/10, 최소 3개, 최대 50개)
        recommended_partitions = max(3, min(50, target_rooms // 10))
        
        # Consumer 수 추천 (파티션 수와 같거나 약간 적게)
        recommended_consumers = max(3, min(recommended_partitions, recommended_partitions // 1.2))
        
        # 예상 처리량
        estimated_throughput = current_throughput * scale_factor * 0.8  # 20% 오버헤드 고려
        
        # 신뢰도 평가
        if current_rooms >= 10:
            confidence = 'High'
        elif current_rooms >= 5:
            confidence = 'Medium'
        else:
            confidence = 'Low'
        
        return {
            'target_rooms': target_rooms,
            'current_rooms': current_rooms,
            'scale_factor': round(scale_factor, 2),
            'recommended_partitions': int(recommended_partitions),
            'recommended_consumers': int(recommended_consumers),
            'estimated_throughput': round(estimated_throughput),
            'confidence': confidence
        }
    
    def display_main_dashboard(self):
        """메인 대시보드 표시"""
        if not self.metrics_history:
            return
        
        current = self.metrics_history[-1]
        indicators = self.calculate_performance_indicators()
        grade, status, score = self.get_performance_grade(indicators)
        uptime = int(time.time() - self.start_time)
        
        # 헤더
        print("🚀 참견도치 Kafka 성능 분석 대시보드")
        print("=" * 80)
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | ⏱️ 가동시간: {uptime//3600:02d}:{(uptime%3600)//60:02d}:{uptime%60:02d}")
        print("=" * 80)
        
        # 성능 등급
        print(f"🎯 종합 성능 등급: {grade} {status} ({score:.1f}점)")
        print("-" * 80)
        
        # 실시간 지표
        print("📊 실시간 성능 지표")
        print("-" * 80)
        print(f"🏠 활성 방 개수       │ {current['active_rooms']:>8,}개")
        print(f"👥 총 참가자 수       │ {current['total_participants']:>8,}명") 
        print(f"⚡ 현재 처리량        │ {indicators.get('throughput', 0):>8.1f} msg/s")
        print(f"⚖️  파티션 균형도      │ {indicators.get('partition_balance', 0):>8.1f} ({indicators.get('partition_balance', 0)*100:.1f}%)")
        print(f"📈 예상 최대 용량     │ {indicators.get('estimated_capacity', 0):>8,}개 방")
        print(f"📊 현재 부하율       │ {indicators.get('load_percentage', 0):>8.1f}%")
        
        # Consumer 상태
        print("\n🔄 Consumer 처리 현황")
        print("-" * 80)
        total_processed = 0
        for consumer, count in current['consumer_stats'].items():
            prev_count = self.metrics_history[-2]['consumer_stats'].get(consumer, 0) if len(self.metrics_history) >= 2 else 0
            recent_throughput = max(0, count - prev_count)
            status_emoji = "🟢" if recent_throughput > 0 else "🟡"
            total_processed += count
            
            print(f"{consumer:<20} │ {status_emoji} │ 총 {count:>6,}개 │ 최근 {recent_throughput:>3}개/s")
        
        # 파티션 분산 상태
        print(f"\n📊 파티션 분산 현황 (총 {sum(current['partition_stats'].values())}개 방)")
        print("-" * 80)
        for partition in range(3):
            count = current['partition_stats'].get(partition, 0)
            percentage = (count / max(1, sum(current['partition_stats'].values()))) * 100
            bar_length = int(percentage / 100 * 40)
            bar = "█" * bar_length + "░" * (40 - bar_length)
            
            print(f"Partition {partition}: {bar} {count:>4}개 ({percentage:5.1f}%)")
        
        # 갈등 레벨 분포
        if current['conflict_distribution']:
            self.draw_ascii_chart(current['conflict_distribution'], "갈등 레벨 분포", 40)
        
        # 처리량 추이
        self.draw_throughput_trend()
        
        # 확장성 예측
        print("\n🔮 확장성 예측 분석")
        print("-" * 80)
        for target in [100, 500, 1000]:
            prediction = self.predict_scaling_requirements(target)
            print(f"{target:>4}개 방 지원 → P:{prediction['recommended_partitions']:>2}개 | C:{prediction['recommended_consumers']:>2}개 | {prediction['estimated_throughput']:>4.0f} msg/s | 신뢰도:{prediction['confidence']}")
    
    def run_dashboard(self, refresh_interval=2):
        """대시보드 실행"""
        print("🎯 [Dashboard] 성능 분석 대시보드 시작...")
        
        try:
            while True:
                # 메트릭 수집
                metrics = self.collect_metrics()
                if metrics:
                    self.metrics_history.append(metrics)
                    
                    # 처리량 계산 및 저장
                    if len(self.metrics_history) >= 2:
                        indicators = self.calculate_performance_indicators()
                        self.throughput_history.append(indicators.get('throughput', 0))
                
                # 대시보드 표시
                self.clear_screen()
                self.display_main_dashboard()
                
                # 하단 정보
                print("\n" + "=" * 80)
                print("💡 실시간 성능 분석 중... (Ctrl+C로 종료)")
                print("🎯 최적화 권장사항: 파티션 균형도 80% 이상, 처리량 100+ msg/s 유지")
                
                time.sleep(refresh_interval)
                
        except KeyboardInterrupt:
            print("\n\n👋 [Dashboard] 성능 대시보드 종료")
        except Exception as e:
            print(f"\n❌ [Dashboard] 오류 발생: {e}")

def main():
    """메인 실행 함수"""
    dashboard = PerformanceDashboard()
    
    print("🎯 Kafka 성능 분석 대시보드")
    print("=" * 60)
    print("📈 기능:")
    print("  - 실시간 성능 지표 모니터링")
    print("  - 파티션 균형도 분석") 
    print("  - 처리량 추이 시각화")
    print("  - 확장성 예측 모델링")
    print("  - 종합 성능 등급 평가")
    print("\n⏳ 3초 후 대시보드 시작...")
    
    for i in range(3, 0, -1):
        print(f"⏰ {i}초...")
        time.sleep(1)
    
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()