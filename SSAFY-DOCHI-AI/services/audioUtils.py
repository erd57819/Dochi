from typing import Tuple
import io
from pydub import AudioSegment

class AudioUtils:
    """오디오 변환 및 처리를 위한 유틸리티 클래스입니다."""
    
    @staticmethod
    def convertToWav(audioData: bytes, inputFormat: str = "webm") -> bytes:
        """오디오 데이터를 WAV 형식으로 변환합니다."""
        try:
            # 입력 형식에 따라 AudioSegment로 로드
            if inputFormat.lower() in ["webm", "ogg"]:
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="ogg")
            elif inputFormat.lower() == "mp3":
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="mp3")
            elif inputFormat.lower() == "m4a":
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="m4a")
            elif inputFormat.lower() == "mp4":
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="mp4")
            elif inputFormat.lower() == "wav":
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="wav")
            else:
                # 기본적으로 자동 감지 시도
                audio = AudioSegment.from_file(io.BytesIO(audioData))
            
            # WAV로 변환 (16kHz, mono, 16bit)
            audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            
            # BytesIO로 WAV 데이터 출력
            wavBuffer = io.BytesIO()
            audio.export(wavBuffer, format="wav")
            wavBuffer.seek(0)
            
            return wavBuffer.read()
        
        except Exception as e:
            print(f"오디오 WAV 변환 오류: {e}")
            return audioData
    
    @staticmethod
    def convertToMp3(audioData: bytes, inputFilename: str = "audio.webm") -> bytes:
        """오디오 데이터를 MP3 형식으로 변환합니다."""
        try:
            # 파일 확장자에 따른 형식 감지
            if inputFilename.lower().endswith(('.webm', '.ogg')):
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="ogg")
            elif inputFilename.lower().endswith('.mp4'):
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="mp4")
            elif inputFilename.lower().endswith('.wav'):
                audio = AudioSegment.from_file(io.BytesIO(audioData), format="wav")
            elif inputFilename.lower().endswith('.mp3'):
                return audioData  # 이미 MP3 형식
            else:
                # 기본적으로 webm으로 시도
                audio = AudioSegment.from_file(io.BytesIO(audioData))
            
            # MP3로 변환
            mp3Buffer = io.BytesIO()
            audio.export(mp3Buffer, format="mp3", bitrate="128k")
            mp3Buffer.seek(0)
            
            return mp3Buffer.read()
            
        except Exception as e:
            print(f"오디오 MP3 변환 오류: {e}")
            return audioData
    
    @staticmethod
    def detectAudioFormat(filename: str) -> str:
        """파일명으로부터 오디오 형식을 감지합니다."""
        if filename.lower().endswith(('.webm', '.ogg')):
            return "webm"
        elif filename.lower().endswith('.mp3'):
            return "mp3"
        elif filename.lower().endswith('.mp4'):
            return "mp4"
        elif filename.lower().endswith('.wav'):
            return "wav"
        elif filename.lower().endswith('.m4a'):
            return "m4a"
        else:
            return "webm"  # 기본값