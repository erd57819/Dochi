# services/consumerBase.py
from confluent_kafka import Consumer
from core.config import settings

class BaseKafkaConsumer:
    def __init__(self, topic, group_id="dochi-consumers"):
        self.topic = topic
        self.group_id = group_id
        self.consumer: Consumer | None = None

    def init_consumer(self):
        """Kafka Consumer 초기화"""
        self.consumer = Consumer({
            'bootstrap.servers': settings.kafka_bootstrap_servers,
            'group.id': self.group_id,
            'auto.offset.reset': 'earliest'
        })
        print(f"[Kafka] Consumer initialized with {settings.kafka_bootstrap_servers}")

    def start(self):
        """Consumer 실행 루프"""
        if not self.consumer:
            raise RuntimeError("Kafka consumer not initialized")
        print(f"[Kafka] Consumer started for topic: {self.topic}")
        self.consumer.subscribe([self.topic])
        try:
            while True:
                msg = self.consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    print(f"Consumer error: {msg.error()}")
                    continue
                self.handle_message(msg.value().decode('utf-8'))
        finally:
            self.consumer.close()

    def close_consumer(self):
        """Kafka Consumer 종료 처리"""
        if self.consumer:
            try:
                print("[Kafka] Closing consumer...")
                self.consumer.close()
                self.consumer = None
                print("[Kafka] Consumer closed successfully")
            except Exception as e:
                print(f"[Kafka] Error closing consumer: {e}")

    def handle_message(self, message: str):
        """메시지 처리 (하위 클래스 구현)"""
        raise NotImplementedError
