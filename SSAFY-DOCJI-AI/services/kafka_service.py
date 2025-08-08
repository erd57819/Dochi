from confluent_kafka import Producer
import os

conf = {
    'bootstrap.servers': os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'dochi-kafka:9092')
}

producer = Producer(**conf)

def delivery_report(err, msg):
    if err is not None:
        print(f'Delivery failed: {err}')
    else:
        print(f'Message delivered to {msg.topic()} [{msg.partition()}]')

def produce(topic: str, message: str):
    producer.produce(topic, value=message, callback=delivery_report)
    producer.flush()
