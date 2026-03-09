import cv2
import numpy as np
from insightface.app import FaceAnalysis

# load model once
face_app = FaceAnalysis(name="buffalo_s", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=-1, det_size=(320, 320))  # GPU, CPU ke liye -1


def read_image_from_file(file):

    file_bytes = np.frombuffer(file.read(), np.uint8)

    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    return img


def extract_faces(image):

    faces = face_app.get(image)

    return faces


def get_embedding_from_image(image):

    faces = extract_faces(image)

    if len(faces) == 0:
        return None

    return faces[0].embedding