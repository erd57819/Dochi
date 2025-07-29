package com.ssafy.dochi.conflict.dao;

import com.ssafy.dochi.conflict.domain.UserConflict;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Optional;

@Mapper
public interface ConflictDao {
    
    // 갈등 생성
    void save(UserConflict conflict);
    
    // 갈등 조회
    Optional<UserConflict> findById(Long id);
    
    // 사용자별 갈등 목록 조회
    List<UserConflict> findByUserId(Long userId);
    
    // 갈등 수정
    void update(UserConflict conflict);
    
    // 갈등 삭제
    void deleteById(Long id);
    
    // 사용자별 갈등 개수
    int countByUserId(Long userId);
}