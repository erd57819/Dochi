package com.ssafy.dochi.openvidu.dao;

import com.ssafy.dochi.openvidu.domain.UserSession;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserSessionDao {
    void insertSession(UserSession userSession);
    boolean existsBySessionIdAndUserId(@Param("sessionId") String sessionId, @Param("userId") Long userId);

}
