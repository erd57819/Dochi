# simulation/loadTestSimulator.py
import asyncio
import aiohttp
import json
import time
import random
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import threading
from dataclasses import dataclass
from typing import List
import sys

@dataclass
class SimulationConfig:
    """시뮬레이션 설정"""
    total_rooms: int = 100
    concurrent_requests: int = 10
    duration_seconds: int = 300  # 5분
    base_url: str = "http://localhost:8080"
    metrics_interval: int = 5  # 5초마다 메트릭 전송
    
class LoadTestSimulator:
    """
    Kafka 확장성 부하 테스트 시뮬레이터
    실제 VideoCall 서비스 영향 없이 대량 메트릭 생성
    """
    
    def __init__(self, config: SimulationConfig):
        self.config = config
        self.start_time = time.time()
        self.total_sent = 0
        self.total_failed = 0
        self.response_times = []
        self.active_rooms = {}
        self.lock = threading.Lock()
        
        # 시뮬레이션용 방 이름 패턴
        self.room_patterns = [
            "LOAD-TEST-{:04d}",
            "PERF-DEMO-{:04d}",
            "SCALE-SIM-{:04d}",
            "KAFKA-TEST-{:04d}"
        ]
        
        # 감정 및 활동 패턴
        self.emotion_patterns = ["HAPPY", "NEUTRAL", "CONFUSED", "EXCITED", "CALM"]
        self.activity_patterns = ["SPEAK", "LISTEN", "MUTE", "UNMUTE", "JOIN"]
        
    def generate_realistic_room_data(self, room_id: str):
        """실제와 유사한 방 데이터 생성"""
        # 방별로 일관된 패턴 유지
        room_seed = abs(hash(room_id)) % 1000
        random.seed(room_seed + int(time.time() // 60))  # 매분 변화
        
        # 참가자 수 (1-8명, 2명이 가장 많음)
        participant_weights = [0, 0.4, 0.3, 0.15, 0.08, 0.04, 0.02, 0.01]
        participant_count = random.choices(range(1, 8), weights=participant_weights[1:])[0]
        
        # 통화 지속 시간 (분 단위, 5-45분)
        call_duration = random.randint(300, 2700)  # 5분~45분 (초)
        
        # 갈등 레벨 (대부분 낮음, 가끔 높음)
        conflict_weights = [0.4, 0.3, 0.15, 0.1, 0.05]  # 0-20, 20-40, 40-60, 60-80, 80-100
        conflict_ranges = [(0, 20), (20, 40), (40, 60), (60, 80), (80, 100)]
        selected_range = random.choices(conflict_ranges, weights=conflict_weights)[0]
        conflict_level = random.randint(selected_range[0], selected_range[1])
        
        # STT 메시지 수 (통화 시간과 참가자 수에 비례)
        base_messages = (call_duration // 30) * participant_count  # 30초당 1개 메시지
        total_messages = int(base_messages * random.uniform(0.5, 1.5))
        
        # 감정 점수 (갈등 레벨과 연관)
        emotion_base = 0.8 - (conflict_level / 200)  # 갈등이 높으면 감정 점수 낮음
        avg_emotion = max(0.1, min(0.9, emotion_base + random.uniform(-0.2, 0.2)))
        
        return {
            "roomId": room_id,
            "participantCount": participant_count,
            "callDurationSeconds": call_duration,
            "conflictLevel": conflict_level,
            "totalMessages": total_messages,
            "avgEmotionScore": round(avg_emotion, 3),
            "timestamp": datetime.now().isoformat(),
            "roomStatus": "SIMULATION",
            "priority": abs(hash(room_id)) % 3,  # 파티션 분산용
            "metadata": json.dumps({
                "simulation": True,
                "test_type": "load_test",
                "generated_at": datetime.now().isoformat(),
                "room_seed": room_seed
            })
        }
    
    def generate_user_activity(self, room_id: str):
        """사용자 활동 데이터 생성"""
        room_data = self.active_rooms.get(room_id, {})
        participant_count = room_data.get('participantCount', 2)
        
        # 사용자 ID 생성
        user_id = f"sim-user-{random.randint(1000, 9999)}"
        
        # 활동 타입 (발언이 가장 많음)
        activity_weights = [0.5, 0.2, 0.1, 0.1, 0.1]  # SPEAK, LISTEN, MUTE, UNMUTE, JOIN
        activity_type = random.choices(self.activity_patterns, weights=activity_weights)[0]
        
        # 발언 길이 (SPEAK일 때만)
        speak_duration = random.uniform(2.0, 30.0) if activity_type == "SPEAK" else None
        
        # 감정 상태 (갈등 레벨에 따라)
        conflict_level = room_data.get('conflictLevel', 20)
        if conflict_level > 60:
            emotion_weights = [0.1, 0.2, 0.3, 0.2, 0.2]  # 부정적 감정 증가
        else:
            emotion_weights = [0.4, 0.3, 0.1, 0.1, 0.1]  # 긍정적 감정 우세
        
        emotion_state = random.choices(self.emotion_patterns, weights=emotion_weights)[0]
        
        return {
            "roomId": room_id,
            "userId": user_id,
            "activityType": activity_type,
            "speakDuration": speak_duration,
            "emotionState": emotion_state,
            "volumeLevel": random.randint(20, 90),
            "timestamp": datetime.now().isoformat(),
            "sessionId": f"sim-session-{room_id}-{int(time.time())}",
            "deviceInfo": "LoadTest-Simulator-v1.0",
            "contextData": json.dumps({
                "participants": participant_count,
                "simulation": True,
                "conflict_context": conflict_level > 50
            })
        }
    
    async def send_room_metrics(self, session: aiohttp.ClientSession, room_id: str):
        """방 메트릭 전송"""
        room_data = self.generate_realistic_room_data(room_id)
        
        # 활성 방 정보 업데이트
        with self.lock:
            self.active_rooms[room_id] = room_data
        
        start_time = time.time()
        
        try:
            async with session.post(
                f"{self.config.base_url}/api/kafka/room-metrics",
                json=room_data,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                response_time = (time.time() - start_time) * 1000  # ms
                
                with self.lock:
                    self.response_times.append(response_time)
                    
                if response.status == 200:
                    self.total_sent += 1
                    return True, response_time
                else:
                    self.total_failed += 1
                    return False, response_time
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            with self.lock:
                self.total_failed += 1
            return False, response_time
    
    async def send_user_activity(self, session: aiohttp.ClientSession, room_id: str):
        """사용자 활동 전송"""
        activity_data = self.generate_user_activity(room_id)
        
        try:
            async with session.post(
                f"{self.config.base_url}/api/kafka/user-activity",
                json=activity_data,
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=3)
            ) as response:
                return response.status == 200
        except:
            return False
    
    async def simulate_room_lifecycle(self, session: aiohttp.ClientSession, room_id: str):
        """방의 전체 생명주기 시뮬레이션"""
        try:
            # 초기 방 입장
            await self.send_room_metrics(session, room_id)
            
            # 시뮬레이션 기간 동안 주기적 업데이트
            simulation_duration = min(self.config.duration_seconds, random.randint(60, 300))
            updates = simulation_duration // self.config.metrics_interval
            
            for i in range(updates):
                # 방 메트릭 업데이트
                await self.send_room_metrics(session, room_id)
                
                # 사용자 활동 생성 (방 메트릭보다 2-3배 많음)
                activity_count = random.randint(2, 5)
                for _ in range(activity_count):
                    await self.send_user_activity(session, room_id)
                
                # 다음 업데이트까지 대기
                await asyncio.sleep(self.config.metrics_interval)
                
                # 조기 종료 확률 (5%)
                if random.random() < 0.05:
                    break
            
            # 방 정리
            with self.lock:
                self.active_rooms.pop(room_id, None)
                
        except Exception as e:
            print(f"❌ [Simulator] 방 {room_id} 시뮬레이션 오류: {e}")
    
    async def run_batch_simulation(self):
        """배치 시뮬레이션 실행"""
        print(f"🚀 [Simulator] 부하 테스트 시작")
        print(f"📊 설정: {self.config.total_rooms}개 방, {self.config.concurrent_requests}개 동시, {self.config.duration_seconds}초")
        
        connector = aiohttp.TCPConnector(limit=self.config.concurrent_requests * 2)
        timeout = aiohttp.ClientTimeout(total=10)
        
        async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
            # 방 ID 생성
            room_ids = []
            for i in range(self.config.total_rooms):
                pattern = random.choice(self.room_patterns)
                room_id = pattern.format(i)
                room_ids.append(room_id)
            
            # 세마포어로 동시 실행 수 제한
            semaphore = asyncio.Semaphore(self.config.concurrent_requests)
            
            async def limited_simulation(room_id):
                async with semaphore:
                    await self.simulate_room_lifecycle(session, room_id)
            
            # 모든 방 시뮬레이션 동시 시작
            tasks = [limited_simulation(room_id) for room_id in room_ids]
            
            # 진행상황 모니터링
            monitoring_task = asyncio.create_task(self.monitor_progress())
            
            # 시뮬레이션 실행
            await asyncio.gather(*tasks, monitoring_task)
    
    async def monitor_progress(self):
        """시뮬레이션 진행상황 모니터링"""
        start_time = time.time()
        
        while True:
            elapsed = time.time() - start_time
            if elapsed >= self.config.duration_seconds:
                break
            
            with self.lock:
                active_count = len(self.active_rooms)
                success_rate = (self.total_sent / (self.total_sent + self.total_failed) * 100) if (self.total_sent + self.total_failed) > 0 else 0
                avg_response_time = sum(self.response_times[-100:]) / len(self.response_times[-100:]) if self.response_times else 0
            
            print(f"📈 [{int(elapsed):3d}s] 활성방:{active_count:3d} | 성공:{self.total_sent:5d} | 실패:{self.total_failed:3d} | 성공률:{success_rate:5.1f}% | 응답:{avg_response_time:6.1f}ms")
            
            await asyncio.sleep(5)  # 5초마다 상태 출력
    
    def print_final_report(self):
        """최종 시뮬레이션 결과 리포트"""
        duration = time.time() - self.start_time
        total_requests = self.total_sent + self.total_failed
        
        print("\n" + "=" * 80)
        print("🎯 부하 테스트 시뮬레이션 완료 리포트")
        print("=" * 80)
        print(f"⏱️  총 소요시간: {duration:.1f}초")
        print(f"📊 총 요청 수: {total_requests:,}개")
        print(f"✅ 성공: {self.total_sent:,}개")
        print(f"❌ 실패: {self.total_failed:,}개")
        print(f"📈 성공률: {(self.total_sent / total_requests * 100) if total_requests > 0 else 0:.2f}%")
        print(f"⚡ 초당 처리량: {total_requests / duration if duration > 0 else 0:.1f} req/s")
        
        if self.response_times:
            sorted_times = sorted(self.response_times)
            p50 = sorted_times[len(sorted_times)//2]
            p95 = sorted_times[int(len(sorted_times)*0.95)]
            p99 = sorted_times[int(len(sorted_times)*0.99)]
            
            print(f"📊 응답시간 분석:")
            print(f"   평균: {sum(self.response_times)/len(self.response_times):.1f}ms")
            print(f"   P50:  {p50:.1f}ms")
            print(f"   P95:  {p95:.1f}ms")
            print(f"   P99:  {p99:.1f}ms")
        
        print("\n🎯 확장성 평가:")
        if total_requests / duration > 100:
            print("✅ 우수: 초당 100+ 요청 처리 가능")
        elif total_requests / duration > 50:
            print("⚠️  양호: 초당 50+ 요청 처리 가능")
        else:
            print("🔧 개선필요: 처리량 최적화 권장")

async def main():
    """메인 실행 함수"""
    print("🎯 Kafka 확장성 부하 테스트 시뮬레이터")
    print("=" * 60)
    
    # 설정
    config = SimulationConfig(
        total_rooms=50,      # 50개 방 동시 시뮬레이션
        concurrent_requests=10,  # 동시 10개 요청
        duration_seconds=120,    # 2분간 테스트
        base_url="http://localhost:8080"
    )
    
    print(f"📋 테스트 설정:")
    print(f"   방 개수: {config.total_rooms}개")
    print(f"   동시성: {config.concurrent_requests}개")
    print(f"   지속시간: {config.duration_seconds}초")
    print(f"   대상 서버: {config.base_url}")
    
    # 서버 상태 확인
    print(f"\n🔍 서버 상태 확인 중...")
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{config.base_url}/api/kafka/health") as response:
                if response.status == 200:
                    print("✅ Kafka 확장 서비스 활성화됨")
                else:
                    print("❌ Kafka 서비스 비활성화 - 시뮬레이션만 실행")
    except Exception as e:
        print(f"⚠️  서버 연결 확인 실패: {e}")
    
    # 시작 확인
    print(f"\n⏳ 3초 후 부하 테스트 시작...")
    for i in range(3, 0, -1):
        print(f"⏰ {i}...")
        await asyncio.sleep(1)
    
    # 시뮬레이션 실행
    simulator = LoadTestSimulator(config)
    await simulator.run_batch_simulation()
    simulator.print_final_report()

if __name__ == "__main__":
    asyncio.run(main())