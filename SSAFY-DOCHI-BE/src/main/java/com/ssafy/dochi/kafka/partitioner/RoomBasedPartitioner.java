package com.ssafy.dochi.kafka.partitioner;

import org.apache.kafka.clients.producer.Partitioner;
import org.apache.kafka.common.Cluster;
import org.apache.kafka.common.PartitionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 화상채팅방 기반 지능형 파티셔너
 * - Sticky Session: 같은 방은 항상 같은 파티션으로
 * - Load Balancing: 파티션별 부하 균등 분산
 * - Priority Queue: VIP 룸은 전용 파티션 할당
 */
public class RoomBasedPartitioner implements Partitioner {
    
    private static final Logger log = LoggerFactory.getLogger(RoomBasedPartitioner.class);
    
    // 방ID -> 파티션 매핑 캐시 (Sticky Session 보장)
    private final Map<String, Integer> roomPartitionCache = new ConcurrentHashMap<>();
    
    // 파티션별 활성 방 카운터 (부하 분산용)
    private final Map<Integer, AtomicInteger> partitionLoadMap = new ConcurrentHashMap<>();
    
    // Round-robin을 위한 카운터
    private final AtomicInteger roundRobinCounter = new AtomicInteger(0);
    
    // VIP 전용 파티션 비율 (전체의 20%)
    private static final double VIP_PARTITION_RATIO = 0.2;
    
    @Override
    public void configure(Map<String, ?> configs) {
        log.info("RoomBasedPartitioner 초기화 - Sticky Session + Load Balancing 적용");
    }
    
    @Override
    public int partition(String topic, Object key, byte[] keyBytes, 
                        Object value, byte[] valueBytes, Cluster cluster) {
        
        List<PartitionInfo> partitions = cluster.partitionsForTopic(topic);
        int numPartitions = partitions.size();
        
        if (key == null) {
            // 키가 없으면 라운드 로빈
            return roundRobinCounter.getAndIncrement() % numPartitions;
        }
        
        String roomKey = key.toString();
        
        // Priority 체크 (roomKey가 "VIP_"로 시작하면 우선순위)
        if (roomKey.startsWith("VIP_")) {
            return assignVipPartition(roomKey, numPartitions);
        }
        
        // 이미 할당된 파티션이 있는지 확인 (Sticky Session)
        Integer cachedPartition = roomPartitionCache.get(roomKey);
        if (cachedPartition != null) {
            log.debug("방 {} - 기존 파티션 {} 재사용 (Sticky Session)", roomKey, cachedPartition);
            return cachedPartition;
        }
        
        // 새로운 방 - 부하가 가장 적은 파티션 선택
        int selectedPartition = selectLeastLoadedPartition(numPartitions);
        
        // 캐시에 저장
        roomPartitionCache.put(roomKey, selectedPartition);
        
        // 부하 카운터 증가
        partitionLoadMap.computeIfAbsent(selectedPartition, k -> new AtomicInteger(0))
                       .incrementAndGet();
        
        log.info("방 {} - 파티션 {} 할당 (현재 부하: {})", 
                roomKey, selectedPartition, 
                partitionLoadMap.get(selectedPartition).get());
        
        return selectedPartition;
    }
    
    /**
     * VIP 룸 전용 파티션 할당
     */
    private int assignVipPartition(String roomKey, int numPartitions) {
        int vipPartitionCount = Math.max(1, (int)(numPartitions * VIP_PARTITION_RATIO));
        int vipPartition = Math.abs(roomKey.hashCode()) % vipPartitionCount;
        
        log.info("VIP 방 {} - 전용 파티션 {} 할당", roomKey, vipPartition);
        return vipPartition;
    }
    
    /**
     * 부하가 가장 적은 파티션 선택
     */
    private int selectLeastLoadedPartition(int numPartitions) {
        int minLoad = Integer.MAX_VALUE;
        int selectedPartition = 0;
        
        // VIP 파티션 제외한 일반 파티션 범위
        int vipPartitionCount = Math.max(1, (int)(numPartitions * VIP_PARTITION_RATIO));
        int startPartition = vipPartitionCount;
        
        for (int i = startPartition; i < numPartitions; i++) {
            AtomicInteger load = partitionLoadMap.get(i);
            int currentLoad = (load == null) ? 0 : load.get();
            
            if (currentLoad < minLoad) {
                minLoad = currentLoad;
                selectedPartition = i;
            }
        }
        
        return selectedPartition;
    }
    
    @Override
    public void close() {
        log.info("파티셔너 종료 - 캐시된 방 수: {}", roomPartitionCache.size());
        roomPartitionCache.clear();
        partitionLoadMap.clear();
    }
    
    /**
     * 모니터링용 - 현재 파티션별 부하 상태
     */
    public Map<Integer, AtomicInteger> getPartitionLoadStatus() {
        return new ConcurrentHashMap<>(partitionLoadMap);
    }
    
    /**
     * 방 종료 시 캐시 정리
     */
    public void releaseRoom(String roomKey) {
        Integer partition = roomPartitionCache.remove(roomKey);
        if (partition != null) {
            AtomicInteger load = partitionLoadMap.get(partition);
            if (load != null) {
                load.decrementAndGet();
                log.debug("방 {} 종료 - 파티션 {} 부하 감소", roomKey, partition);
            }
        }
    }
}