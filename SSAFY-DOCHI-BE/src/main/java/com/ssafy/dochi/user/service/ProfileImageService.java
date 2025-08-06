package com.ssafy.dochi.user.service;

import com.ssafy.dochi.user.dao.UserDao;
import com.ssafy.dochi.user.domain.User;
import com.ssafy.dochi.user.dto.request.ProfileImageReqDto;
import com.ssafy.dochi.user.dto.response.ProfileImageResDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileImageService {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final UserDao userDao;

    @Value("${aws.s3.bucket}")
    private String bucketName;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    /**
     * 프로필 이미지 업로드용 Presigned URL 생성
     */
    public ProfileImageResDto generateProfileImageUploadUrl(Long memberId, ProfileImageReqDto request) {
        // 사용자 존재 확인
        User user = userDao.findById(memberId).orElseThrow(
                () -> new IllegalArgumentException("존재하지 않는 사용자입니다.")
        );

        // 파일 타입 검증
        if (!ALLOWED_IMAGE_TYPES.contains(request.getContentType())) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 허용)");
        }

        try {
            // 프로필 이미지 키 생성 (사용자별 고유)
            String imageKey = generateProfileImageKey(memberId, request.getFileName());

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(imageKey)
                    .contentType(request.getContentType())
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(10)) // 10분 유효
                    .putObjectRequest(putObjectRequest)
                    .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

            return new ProfileImageResDto(
                    presignedRequest.url().toString(),
                    imageKey,
                    "프로필 이미지 업로드 URL이 생성되었습니다."
            );

        } catch (Exception e) {
            log.error("프로필 이미지 Presigned URL 생성 실패 - userId: {}", memberId, e);
            throw new RuntimeException("Presigned URL 생성에 실패했습니다.", e);
        }
    }

    /**
     * 프로필 이미지 키 생성 (사용자별 고유)
     */
    private String generateProfileImageKey(Long userId, String originalFileName) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String extension = getFileExtension(originalFileName);
        return String.format("profiles/%d/%s%s", userId, timestamp, extension);
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.'));
    }

    /**
     * 프로필 이미지 업로드 완료 처리 (DB 업데이트)
     */
    @Transactional
    public void completeProfileImageUpload(Long userId, String imageKey) {
        // 사용자 존재 확인
        User user = userDao.findById(userId).orElseThrow(
                () -> new IllegalArgumentException("존재하지 않는 사용자입니다.")
        );

        // S3에서 파일 존재 확인
        if (!isFileExistsInS3(imageKey)) {
            throw new IllegalArgumentException("업로드된 파일을 찾을 수 없습니다.");
        }

        // 기존 프로필 이미지 삭제
        if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
            deleteOldProfileImage(user.getProfileImage());
        }

        // 새 프로필 이미지 URL 생성 및 DB 업데이트
        String imageUrl = generateImageUrl(imageKey);
        userDao.updateProfileImage(userId, imageUrl);

        log.info("프로필 이미지 업데이트 완료 - userId: {}, imageKey: {}", userId, imageKey);
    }
    /**
     * S3에서 파일 존재 확인
     */
    private boolean isFileExistsInS3(String key) {
        try {
            HeadObjectRequest headObjectRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.headObject(headObjectRequest);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("S3 파일 존재 확인 실패 - key: {}", key, e);
            return false;
        }
    }

    /**
     * 이미지 URL 생성
     */

    @Value("${aws.s3.region}")
    private String region;

    private String generateImageUrl(String imageKey) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName,
                region,
                imageKey);
    }

    /**
     * 기존 프로필 이미지 삭제
     */
    private void deleteOldProfileImage(String imageUrl) {
        try {
            // URL에서 key 추출
            String key = extractKeyFromUrl(imageUrl);
            if (key != null) {
                DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();

                s3Client.deleteObject(deleteRequest);
                log.info("기존 프로필 이미지 삭제 완료 - key: {}", key);
            }
        } catch (Exception e) {
            log.error("기존 프로필 이미지 삭제 실패 - url: {}", imageUrl, e);
            // 삭제 실패해도 진행 (새 이미지 업로드는 성공)
        }
    }

    /**
     * URL에서 S3 key 추출
     */
    private String extractKeyFromUrl(String url) {
        try {
            String pattern = String.format("https://%s\\.s3\\.[^/]+\\.amazonaws\\.com/(.+)", bucketName);
            Pattern regex = Pattern.compile(pattern);
            Matcher matcher = regex.matcher(url);

            if (matcher.find()) {
                return matcher.group(1);
            }
            return null;

        } catch (Exception e) {
            log.error("URL에서 key 추출 실패 - url: {}", url, e);
            return null;
        }
    }

}
