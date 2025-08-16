// download-face-api-models.js
// Face-API 모델을 로컬에 다운로드하는 스크립트

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = './public/models';
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// 다운로드할 모델 파일들
const modelFiles = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // Face Landmark 68
  'face_landmark_68_model-weights_manifest.json', 
  'face_landmark_68_model-shard1',
  
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  
  // Face Expression
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// 디렉토리 생성
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`✅ 디렉토리 생성됨: ${MODELS_DIR}`);
}

// 파일 다운로드 함수
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ 다운로드 완료: ${path.basename(filepath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // 실패 시 파일 삭제
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 모든 모델 파일 다운로드
async function downloadAllModels() {
  console.log('🚀 Face-API 모델 다운로드 시작...');
  console.log(`📁 대상 디렉토리: ${MODELS_DIR}`);
  
  for (const filename of modelFiles) {
    const url = `${BASE_URL}/${filename}`;
    const filepath = path.join(MODELS_DIR, filename);
    
    // 이미 파일이 존재하면 스킵
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  이미 존재함: ${filename}`);
      continue;
    }
    
    try {
      console.log(`⬇️  다운로드 중: ${filename}`);
      await downloadFile(url, filepath);
    } catch (error) {
      console.error(`❌ 다운로드 실패: ${filename}`, error.message);
      process.exit(1);
    }
  }
  
  console.log('🎉 모든 Face-API 모델 다운로드 완료!');
  console.log('이제 애플리케이션에서 로컬 모델을 사용할 수 있습니다.');
}

// 스크립트 실행
downloadAllModels().catch(console.error);