# services/kafkaPartitionService.py
from confluent_kafka import Producer, Consumer
from confluent_kafka.admin import AdminClient, ConfigResource, ConfigResourceType, NewTopic
from core.config import settings
import hashlib
import json
import threading
import time
from typing import Dict, List, Optional

class KafkaPartitionManager:
    """Kafka 파티셔닝 관리자 - 기존 코드 완전 호환"""
    
    def __init__(self, num_partitions: int = 10):
        self.num_partitions = num_partitions
        self.producer: Optional[Producer] = None
        self.admin_client: Optional[AdminClient] = None
        self.partition_consumers: Dict[int, Consumer] = {}
        self.consumer_threads: List[threading.Thread] = []
        self.is_running = False
        
        # 파티션별 통계
        self.partition_stats = {i: {"rooms": set(), "messages": 0} for i in range(num_partitions)}
        
    def init_partition_producer(self):
        """파티션 지원 Producer 초기화"""
        conf = {
            'bootstrap.servers': settings.kafka_bootstrap_servers,
            'client.id': 'dochi-partition-producer'
        }
        self.producer = Producer(conf)
        
        # Admin client 초기화
        self.admin_client = AdminClient({'bootstrap.servers': settings.kafka_bootstrap_servers})
        print(f"[Kafka Partition] Producer initialized with {self.num_partitions} partitions")
        
    def create_partitioned_topics(self, topics: List[str]):
        """파티셔닝된 토픽 생성"""
        if not self.admin_client:
            self.init_partition_producer()
            
        new_topics = []
        for topic in topics:
            new_topic = NewTopic(
                topic=f"{topic}_partitioned",
                num_partitions=self.num_partitions,
                replication_factor=1
            )
            new_topics.append(new_topic)
            
        try:
            # 토픽 생성
            fs = self.admin_client.create_topics(new_topics)
            for topic, f in fs.items():
                try:
                    f.result()  # 결과 대기
                    print(f"[Kafka Partition] Topic {topic} created with {self.num_partitions} partitions")
                except Exception as e:
                    if "already exists" in str(e).lower():
                        print(f"[Kafka Partition] Topic {topic} already exists")
                    else:
                        print(f"[Kafka Partition] Failed to create topic {topic}: {e}")
        except Exception as e:
            print(f"[Kafka Partition] Error creating topics: {e}")
            
    def get_partition_for_room(self, room_id: str) -> int:
        """방 ID를 기반으로 파티션 번호 결정"""
        # room_id를 해시하여 일관된 파티션 할당
        hash_value = int(hashlib.md5(room_id.encode()).hexdigest(), 16)
        partition = hash_value % self.num_partitions
        
        # 통계 업데이트
        self.partition_stats[partition]["rooms"].add(room_id)
        
        return partition
        
    def produce_to_partition(self, topic: str, room_id: str, message: str):
        """방 ID 기반으로 특정 파티션에 메시지 전송"""
        if not self.producer:
            raise RuntimeError("Partition producer not initialized")
            
        partition = self.get_partition_for_room(room_id)
        partitioned_topic = f"{topic}_partitioned"
        
        # 메시지에 방 ID와 파티션 정보 추가
        enriched_message = {
            "room_id": room_id,
            "partition": partition,
            "timestamp": time.time(),
            "original_data": message
        }
        
        try:
            self.producer.produce(
                topic=partitioned_topic,
                partition=partition,
                key=room_id,
                value=json.dumps(enriched_message),
                callback=self._delivery_report
            )
            self.producer.flush()
            
            # 통계 업데이트
            self.partition_stats[partition]["messages"] += 1
            
        except Exception as e:
            print(f"[Kafka Partition] Error producing to partition {partition}: {e}")
            
    def _delivery_report(self, err, msg):
        """메시지 전송 확인 콜백"""
        if err is not None:
            print(f"[Kafka Partition] Delivery failed: {err}")
        else:
            print(f"[Kafka Partition] Message delivered to {msg.topic()} [partition:{msg.partition()}]")
            
    def start_partition_consumers(self, topic: str, message_handler_func):
        """각 파티션별 Consumer 시작"""
        if self.is_running:
            print("[Kafka Partition] Consumers already running")
            return
            
        self.is_running = True
        partitioned_topic = f"{topic}_partitioned"
        
        # 각 파티션별로 Consumer 생성 및 시작
        for partition_id in range(self.num_partitions):
            consumer = Consumer({
                'bootstrap.servers': settings.kafka_bootstrap_servers,
                'group.id': f'dochi-partition-consumer-{partition_id}',
                'auto.offset.reset': 'latest',
                'enable.auto.commit': True
            })
            
            self.partition_consumers[partition_id] = consumer
            
            # Consumer 스레드 시작
            thread = threading.Thread(
                target=self._consumer_loop,
                args=(consumer, partitioned_topic, partition_id, message_handler_func),
                daemon=True
            )
            thread.start()
            self.consumer_threads.append(thread)
            
        print(f"[Kafka Partition] Started {self.num_partitions} partition consumers for {partitioned_topic}")
        
    def _consumer_loop(self, consumer: Consumer, topic: str, partition_id: int, message_handler):
        """개별 Consumer 실행 루프"""
        try:
            # 특정 파티션만 구독
            from confluent_kafka import TopicPartition
            tp = TopicPartition(topic, partition_id)
            consumer.assign([tp])
            
            print(f"[Kafka Partition] Consumer {partition_id} started for partition {partition_id}")
            
            while self.is_running:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                    
                if msg.error():
                    print(f"[Kafka Partition] Consumer {partition_id} error: {msg.error()}")
                    continue
                    
                try:
                    # 메시지 파싱
                    message_data = json.loads(msg.value().decode('utf-8'))
                    room_id = message_data.get("room_id")
                    original_data = message_data.get("original_data")
                    
                    # 원본 메시지 핸들러 호출 (기존 코드와 동일한 형태)
                    if message_handler and original_data:
                        message_handler(original_data)
                        
                    print(f"[Kafka Partition] Partition {partition_id} processed message from room {room_id}")
                    
                except Exception as e:
                    print(f"[Kafka Partition] Error processing message in partition {partition_id}: {e}")
                    
        except Exception as e:
            print(f"[Kafka Partition] Consumer {partition_id} crashed: {e}")
        finally:
            consumer.close()
            
    def stop_partition_consumers(self):
        """모든 파티션 Consumer 중지"""
        self.is_running = False
        
        for partition_id, consumer in self.partition_consumers.items():
            try:
                consumer.close()
                print(f"[Kafka Partition] Consumer {partition_id} closed")
            except Exception as e:
                print(f"[Kafka Partition] Error closing consumer {partition_id}: {e}")
                
        self.partition_consumers.clear()
        self.consumer_threads.clear()
        
    def get_partition_statistics(self) -> Dict:
        """파티션별 통계 정보 반환"""
        stats = {}
        for partition_id, data in self.partition_stats.items():
            stats[f"partition_{partition_id}"] = {
                "active_rooms": len(data["rooms"]),
                "room_list": list(data["rooms"]),
                "total_messages": data["messages"]
            }
        return stats
        
    def rebalance_partitions(self) -> Dict:
        """파티션 리밸런싱 정보 제공"""
        # 각 파티션의 부하 계산
        loads = []
        for partition_id, data in self.partition_stats.items():
            load = len(data["rooms"]) + (data["messages"] / 1000)  # 방 수 + 메시지 비율
            loads.append((partition_id, load))
            
        # 부하별 정렬
        loads.sort(key=lambda x: x[1])
        
        return {
            "lightest_partition": loads[0],
            "heaviest_partition": loads[-1],
            "average_load": sum(load for _, load in loads) / len(loads),
            "load_distribution": loads
        }

# 전역 파티션 매니저 인스턴스
partition_manager = KafkaPartitionManager()

# 기존 코드와의 호환성을 위한 래퍼 함수들
def init_partition_kafka():
    """파티션 시스템 초기화"""
    partition_manager.init_partition_producer()
    partition_manager.create_partitioned_topics(['emotion', 'stt', 'speech'])
    
def produce_with_partitioning(topic: str, room_id: str, message: str):
    """파티셔닝을 사용한 메시지 전송"""
    partition_manager.produce_to_partition(topic, room_id, message)
    
def start_partitioned_consumers(topic: str, message_handler):
    """파티션별 Consumer 시작"""
    partition_manager.start_partition_consumers(topic, message_handler)
    
def get_kafka_partition_stats():
    """파티션 통계 조회"""
    return partition_manager.get_partition_statistics()

def close_partition_kafka():
    """파티션 시스템 종료"""
    partition_manager.stop_partition_consumers()