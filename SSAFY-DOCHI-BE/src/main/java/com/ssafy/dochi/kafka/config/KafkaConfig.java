package com.ssafy.dochi.kafka.config;

import com.ssafy.dochi.kafka.partitioner.RoomBasedPartitioner;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
@Profile({"kafka", "dev", "prod"}) // kafka, dev, prod 환경에서 활성화
@ConditionalOnProperty(name = "kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers:dochi-kafka:9092}")
    private String bootstrapServers;

    // 토픽 생성 - 파티션 10개로 시작 (방 100개당 파티션 1개 기준)
    @Bean
    public NewTopic videoCallEventsTopic() {
        return TopicBuilder.name("video-call-events")
                .partitions(10)
                .replicas(1)
                .config("retention.ms", "86400000") // 1일 보관
                .config("segment.ms", "3600000") // 1시간 세그먼트
                .build();
    }

    @Bean
    public NewTopic videoCallMetricsTopic() {
        return TopicBuilder.name("video-call-metrics")
                .partitions(5)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic priorityVideoCallTopic() {
        return TopicBuilder.name("priority-video-calls")
                .partitions(3) // VIP 전용 파티션
                .replicas(1)
                .build();
    }

    // Producer 설정
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        
        // 성능 최적화 설정
        props.put(ProducerConfig.ACKS_CONFIG, "1"); // 리더 확인만
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy"); // 압축
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384); // 배치 크기
        props.put(ProducerConfig.LINGER_MS_CONFIG, 10); // 배치 대기시간
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432); // 버퍼 메모리
        
        // Custom Partitioner 적용
        props.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, RoomBasedPartitioner.class);
        
        // 멱등성 보장
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        props.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);
        
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // Consumer 설정
    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "video-call-processor");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.ssafy.dochi.kafka.dto");
        
        // Consumer 성능 최적화
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
        props.put(ConsumerConfig.FETCH_MIN_BYTES_CONFIG, 1);
        props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG, 500);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 10000);
        
        // 오프셋 관리
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false); // 수동 커밋
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        
        // 동시 처리 스레드 설정 (파티션당 1개)
        factory.setConcurrency(10);
        
        // 배치 리스너 설정
        factory.setBatchListener(true);
        
        // 에러 핸들링
        factory.setCommonErrorHandler(new org.springframework.kafka.listener.DefaultErrorHandler());
        
        return factory;
    }

    // Kafka Admin 설정 (동적 파티션 관리용)
    @Bean
    public KafkaAdmin kafkaAdmin() {
        Map<String, Object> configs = new HashMap<>();
        configs.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        return new KafkaAdmin(configs);
    }
}