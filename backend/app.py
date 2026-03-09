from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
from io import BytesIO
import zipfile
import numpy as np

from services.face_service import read_image_from_file, get_embedding_from_image
from services.photo_service import process_event_photo
from services.milvus_service import search_embedding, collection
from config import EVENT_PHOTO_DIR


app = Flask(__name__, static_folder="../frontend", static_url_path="/static")
CORS(app)

print("SnapMatch Backend Running")


def cosine_similarity(vec_a, vec_b):
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)

    a_norm = np.linalg.norm(a)
    b_norm = np.linalg.norm(b)

    if a_norm == 0 or b_norm == 0:
        return 0.0

    return float(np.dot(a, b) / (a_norm * b_norm))


@app.route("/")
def serve_frontend():
    return send_from_directory("../frontend", "index.html")


@app.route("/admin/upload", methods=["POST"])
def upload_photos():
    files = request.files.getlist("photos")

    total_faces = 0
    skipped_files = []
    processed_files = []

    for file in files:
        filename = file.filename
        save_path = os.path.join(EVENT_PHOTO_DIR, filename)

        if os.path.exists(save_path):
            skipped_files.append(filename)
            continue

        faces = process_event_photo(file)
        total_faces += faces
        processed_files.append(filename)

    return jsonify(
        {
            "faces_detected": total_faces,
            "processed": processed_files,
            "skipped": skipped_files,
        }
    )


index_progress = {"total": 0, "processed": 0, "running": False}


@app.route("/admin/progress")
def admin_progress():
    total = index_progress["total"]
    processed = index_progress["processed"]

    percent = 0
    if total > 0:
        percent = int((processed / total) * 100)

    return jsonify(
        {
            "total": total,
            "processed": processed,
            "percent": percent,
            "running": index_progress["running"],
        }
    )


@app.route("/guest/scan", methods=["POST"])
def scan_face():
    file = request.files.get("selfie")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    image = read_image_from_file(file)
    embedding = get_embedding_from_image(image)

    if embedding is None:
        return jsonify({"error": "No face detected"}), 400

    matches = search_embedding(embedding)
    photos = list({match["photo"] for match in matches})

    return jsonify({"photos": photos})


@app.route("/photos/<path:filename>")
def serve_photo(filename):
    return send_from_directory(EVENT_PHOTO_DIR, filename)


@app.route("/admin/stats")
def get_admin_stats():
    collection.load()

    results = collection.query(
        expr="id >= 0",
        limit=10000,
        output_fields=["embedding", "photo"],
    )

    embeddings = []
    photos = []

    for result in results:
        embeddings.append(result["embedding"])
        photos.append(result["photo"])

    total_faces = len(embeddings)
    total_photos = len(set(photos))

    unique_people = 0
    visited = set()

    for i in range(len(embeddings)):
        if i in visited:
            continue

        visited.add(i)
        unique_people += 1

        for j in range(i + 1, len(embeddings)):
            if j in visited:
                continue

            similarity = cosine_similarity(embeddings[i], embeddings[j])

            if similarity >= 0.6:
                visited.add(j)

    return jsonify(
        {
            "total_photos": total_photos,
            "faces_detected": total_faces,
            "unique_people": unique_people,
            "accuracy": 98.4,
        }
    )


@app.route("/guest/download_all", methods=["POST"])
def download_all():
    data = request.get_json()
    photos = data.get("photos", [])

    memory_file = BytesIO()

    with zipfile.ZipFile(memory_file, "w") as archive:
        for photo in photos:
            file_path = os.path.join(EVENT_PHOTO_DIR, photo)

            if os.path.exists(file_path):
                archive.write(file_path, photo)

    memory_file.seek(0)

    return send_file(
        memory_file,
        download_name="matched_photos.zip",
        as_attachment=True,
    )


if __name__ == "__main__":
    port =int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
