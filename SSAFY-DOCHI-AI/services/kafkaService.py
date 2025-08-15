# services/kafkaService.py
from confluent_kafka import Producer
from core.config import settings

producer: Producer | None = None  # 타입 힌트

def init_kafka_producer():
    """Kafka Producer 초기화"""
    global producer
    conf = {
        'bootstrap.servers': settings.kafka_bootstrap_servers
    }
    producer = Producer(conf)
    print(f"[Kafka] Producer initialized with {settings.kafka_bootstrap_servers}")

def delivery_report(err, msg):
    """메시지 전송 콜백 (기존 방식)"""
    if err is not None:
        print(f"Delivery failed: {err}")
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

def enhanced_delivery_report(err, msg):
    """향상된 메시지 전송 콜백 (파티셔닝 정보 포함)"""
    if err is not None:
        print(f"❌ [Kafka] 전송 실패: {err}")
    else:
        topic = msg.topic()
        partition = msg.partition()
        offset = msg.offset()
        key = msg.key().decode('utf-8') if msg.key() else 'no-key'
        
        # 파티션 정보와 함께 성공 로그
        print(f"✅ [Kafka] {topic} P{partition}:{offset} (key: {key})")

def produce(topic: str, message: str):
    """토픽으로 메시지 전송 (기존 방식 - 호환성 유지)"""
    if not producer:
        raise RuntimeError("Kafka producer not initialized")
    producer.produce(topic, value=message, callback=delivery_report)
    producer.flush()

def produce_with_partition(topic: str, message: str, partition_key: str):
    """
    파티션 키 기반 메시지 전송 (새로운 확장성 기능)
    같은 partition_key는 항상 같은 파티션으로 전송됨
    """
    if not producer:
        raise RuntimeError("Kafka producer not initialized")
    
    # 파티션 키 기반 전송 (Kafka가 자동으로 파티션 할당)
    producer.produce(
        topic, 
        value=message, 
        key=partition_key,  # 파티션 키 지정
        callback=enhanced_delivery_report
    )
    producer.flush()

def produce_with_specific_partition(topic: str, message: str, partition_key: str, partition_count: int = 3):
    """
    특정 파티션으로 메시지 전송 (데모/시뮬레이션용)
    partition_key를 해시하여 파티션 번호 계산
    """
    if not producer:
        raise RuntimeError("Kafka producer not initialized")
    
    # 파티션 번호 계산 (일관된 해싱)
    partition = abs(hash(partition_key)) % partition_count
    
    producer.produce(
        topic,
        value=message,
        key=partition_key,
        partition=partition,  # 명시적 파티션 지정
        callback=enhanced_delivery_report
    )
    producer.flush()
    
    print(f"[파티셔닝] {partition_key} → Topic:{topic} Partition:{partition}")

def close_kafka_producer():
    """Kafka Producer 종료 처리"""
    global producer
    if producer:
        try:
            print("[Kafka] Flushing and closing producer...")
            producer.flush()
            producer = None
            print("[Kafka] Producer closed successfully")
        except Exception as e:
            print(f"[Kafka] Error closing producer: {e}")
