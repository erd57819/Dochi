from PIL import Image
import base64
import io

def analyze_emotion(base64_img: str) -> str:
    img_bytes = base64.b64decode(base64_img)
    img = Image.open(io.BytesIO(img_bytes))

    # TODO: 감정 인식 모델 (e.g. FER, DeepFace 등)
    return "예시: 행복"
