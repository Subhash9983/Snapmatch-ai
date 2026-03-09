from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility

connections.connect(
    alias="default",
    host="localhost",
    port="19530"
)

COLLECTION_NAME = "faces"


def init_collection():

    if utility.has_collection(COLLECTION_NAME):
        return Collection(COLLECTION_NAME)

    fields = [

        FieldSchema(
            name="id",
            dtype=DataType.INT64,
            is_primary=True,
            auto_id=True
        ),

        FieldSchema(
            name="embedding",
            dtype=DataType.FLOAT_VECTOR,
            dim=512
        ),

        FieldSchema(
            name="photo",
            dtype=DataType.VARCHAR,
            max_length=200
        ),

        FieldSchema(
            name="photo_hash",
            dtype=DataType.VARCHAR,
            max_length=100
        )

    ]

    schema = CollectionSchema(fields)

    collection = Collection(
        name=COLLECTION_NAME,
        schema=schema
    )

    return collection


collection = init_collection()

index_params = {
    "metric_type": "COSINE",
    "index_type": "IVF_FLAT",
    "params": {"nlist": 1024}
}

if not collection.has_index():
    collection.create_index(
        field_name="embedding",
        index_params=index_params
    )

collection.load()


def insert_embedding(embedding, photo, photo_hash):

    data = [
        [embedding],
        [photo],
        [photo_hash]
    ]

    collection.insert(data)
    collection.flush()


def search_embedding(embedding):

    results = collection.search(
        data=[embedding],
        anns_field="embedding",
        param={"metric_type": "COSINE", "params": {"nprobe": 32}},
        limit=20,
        output_fields=["photo"]
    )

    matched = []

    for hit in results[0]:
        print("MATCH SCORE:", hit.score)

        if hit.score > 0.6:  # better threshold

            matched.append({
                "photo": hit.entity.get("photo"),
                "score": hit.score
            })

    return matched