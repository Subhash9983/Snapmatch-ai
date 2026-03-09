# SnapMatch — AI Powered Wedding Photo Finder

SnapMatch is an AI-powered face recognition system that helps guests instantly find their photos from large wedding or event albums.
Instead of manually searching through thousands of photos, users can upload a selfie and instantly see all photos where their face appears.

## Features

* Face detection and embedding generation using InsightFace
* High-speed vector similarity search
* Automatic duplicate photo detection
* Guest selfie scanning
* Instant photo matching
* Download all matched photos
* Admin dashboard with event statistics

## Tech Stack

**AI / ML**

* InsightFace (buffalo_l model)
* ONNX Runtime

**Backend**

* Python
* Flask
* pymilvus

**Vector Database**

* Milvus

**Frontend**

* HTML
* CSS
* JavaScript

## System Architecture

User uploads selfie
↓
Face embedding generated
↓
Vector search in Milvus
↓
Matching photos returned
↓
Results displayed instantly

## Project Structure

```
snapmatch/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── services/
│   │   ├── face_service.py
│   │   ├── milvus_service.py
│   │   └── photo_service.py
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
```

## How It Works

1. Admin uploads event photos.
2. Faces are detected and converted into embeddings.
3. Embeddings are stored in Milvus vector database.
4. Guest uploads a selfie.
5. The system generates a face embedding.
6. Vector search finds similar embeddings.
7. All matching photos are displayed instantly.

## Local Setup

### 1. Clone the repository

```
git clone https://github.com/yourusername/snapmatch-ai.git
cd snapmatch-ai
```

### 2. Create virtual environment

```
python -m venv venv
```

Activate:

Windows

```
venv\Scripts\activate
```

Mac / Linux

```
source venv/bin/activate
```

### 3. Install dependencies

```
pip install -r backend/requirements.txt
```

### 4. Start backend server

```
cd backend
python app.py
```

Server will start at:

```
http://127.0.0.1:5000
```

## Deployment

Frontend can be deployed on Vercel.
Backend can be deployed on Render or Railway.
Milvus can be hosted using Zilliz Cloud.

## Future Improvements

* Multi-event support
* Face clustering for unique guest detection
* Faster vector indexing
* Mobile optimized interface
* Cloud storage integration

## Author

Subhash
BTech (Cyber Security)
AI & Backend Developer
