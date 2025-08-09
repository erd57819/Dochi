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
    """메시지 전송 콜백"""
    if err is not None:
        print(f"Delivery failed: {err}")
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

def produce(topic: str, message: str):
    """토픽으로 메시지 전송"""
    if not producer:
        raise RuntimeError("Kafka producer not initialized")
    producer.produce(topic, value=message, callback=delivery_report)
    producer.flush()

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
