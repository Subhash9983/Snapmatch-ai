import os
import hashlib
from config import EVENT_PHOTO_DIR
from services.face_service import read_image_from_file, extract_faces
from services.milvus_service import insert_embedding, collection


def generate_image_hash(file_bytes):

    sha = hashlib.sha256()
    sha.update(file_bytes)

    return sha.hexdigest()


def process_event_photo(file):

    filename = file.filename
    file_bytes = file.read()

    photo_hash = generate_image_hash(file_bytes)

    existing = collection.query(
        expr=f'photo_hash == "{photo_hash}"',
        output_fields=["photo_hash"],
        limit=1
    )

    if existing:
        print("Duplicate photo skipped")
        return 0

    save_path = os.path.join(EVENT_PHOTO_DIR, filename)

    with open(save_path, "wb") as f:
        f.write(file_bytes)

    image = read_image_from_file(open(save_path, "rb"))

    faces = extract_faces(image)

    for face in faces:

        embedding = face.embedding

        insert_embedding(
            embedding.tolist(),
            filename,
            photo_hash
        )

    return len(faces)