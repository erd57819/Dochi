from confluent_kafka import Consumer
import os

class BaseKafkaConsumer:
    def __init__(self, topic, group_id="dochi-consumers"):
        self.topic = topic
        self.consumer = Consumer({
            'bootstrap.servers': os.getenv("KAFKA_BOOTSTRAP_SERVERS", "dochi-kafka:9092"),
            'group.id': group_id,
            'auto.offset.reset': 'earliest'
        })
    def start(self):
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

    def handle_message(self, message: str):
        raise NotImplementedError