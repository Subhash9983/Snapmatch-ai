import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EVENT_PHOTO_DIR = os.path.join(BASE_DIR, "storage", "event_photos")
VECTOR_DIR = os.path.join(BASE_DIR, "vector_store")

os.makedirs(EVENT_PHOTO_DIR, exist_ok=True)
os.makedirs(VECTOR_DIR, exist_ok=True)

FAISS_INDEX_PATH = os.path.join(VECTOR_DIR, "index.faiss")
METADATA_PATH = os.path.join(VECTOR_DIR, "metadata.pkl")

EMBEDDING_DIM = 512
SIMILARITY_THRESHOLD = 0.4