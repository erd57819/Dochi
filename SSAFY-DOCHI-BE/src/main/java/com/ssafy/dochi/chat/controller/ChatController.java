
package com.ssafy.dochi.chat.controller;

import com.ssafy.dochi.chat.domain.Chat;
import com.ssafy.dochi.chat.domain.ChatRoom;
import com.ssafy.dochi.chat.dto.request.ChatReqDto;
import com.ssafy.dochi.chat.dto.request.ChatRoomCreateReqDto;
import com.ssafy.dochi.chat.dto.request.ChatRoomTitleUpdateReqDto;
import com.ssafy.dochi.chat.dto.response.ChatResDto;
import com.ssafy.dochi.chat.service.ChatService;
import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.security.CustomUserDetails;
import com.ssafy.dochi.common.template.ApiResponse;
import com.ssafy.dochi.common.template.ApiResponseGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms")
    public ApiResponse<?> createRoom(@AuthenticationPrincipal CustomUserDetails user,
                                     @RequestBody ChatRoomCreateReqDto reqDto) {
        Long chatRoomId = chatService.createChatRoom(user.getId(), reqDto.getTitle());
        return ApiResponseGenerator.success(chatRoomId, HttpStatus.CREATED);
    }

    @PostMapping("")
    public ApiResponse<?> chat(@AuthenticationPrincipal CustomUserDetails user,
                               @RequestBody ChatReqDto reqDto) {
        ChatResDto response = chatService.chat(user.getId(), reqDto);
        return ApiResponseGenerator.success(response, HttpStatus.OK);
    }

    @PostMapping("/save")
    public ApiResponse<?> save(@AuthenticationPrincipal CustomUserDetails user,
                               @RequestParam String sessionId,
                               @RequestParam Long chatRoomId) {
        chatService.saveToDatabase(user.getId(), sessionId, chatRoomId);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    @PostMapping("/exit")
    public ApiResponse<?> exit(@AuthenticationPrincipal CustomUserDetails user,
                               @RequestParam String sessionId,
                               @RequestParam Long chatRoomId) {
        chatService.saveToDatabase(user.getId(), sessionId, chatRoomId);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    @GetMapping("/rooms")
    public ApiResponse<?> getRooms(@AuthenticationPrincipal CustomUserDetails user) {
        List<ChatRoom> rooms = chatService.getRooms(user.getId());
        return ApiResponseGenerator.success(rooms, HttpStatus.OK);
    }

    @GetMapping("/rooms/{chatRoomId}/messages")
    public ApiResponse<?> getMessages(@PathVariable Long chatRoomId,
                                      @RequestParam(required = false)
                                      String sessionId) {
        List<Chat> messages = chatService.getMessages(chatRoomId, sessionId);
        return ApiResponseGenerator.success(messages, HttpStatus.OK);
    }

    @DeleteMapping("/rooms/{chatRoomId}")
    public ApiResponse<?> deleteRoom(@PathVariable Long chatRoomId) {
        chatService.deleteRoom(chatRoomId);
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    @PutMapping("/rooms/{chatRoomId}/title")
    ApiResponse<?> updateRoomTitle(@PathVariable("chatRoomId") Long chatRoomId,
                                   @RequestBody ChatRoomTitleUpdateReqDto reqDto) {
        chatService.updateChatRoomTitle(chatRoomId, reqDto.getNewTitle());
        return ApiResponseGenerator.success(HttpStatus.OK);
    }

    @GetMapping("/comic/{comicId}/status")
    public ApiResponse<?> getComicStatus(@PathVariable String comicId) {
        Map<String, String> status = chatService.getComicStatus(comicId);
        return ApiResponseGenerator.success(status, HttpStatus.OK);
    }

}