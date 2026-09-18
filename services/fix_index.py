import os
from qdrant_client import QdrantClient
from dotenv import load_dotenv

load_dotenv()

# Connect to your live Qdrant Cloud
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

collection = "ragner_master_collection"

print("Fixing indexes...")

# Index the exact root keys Qdrant is asking for
client.create_payload_index(
    collection_name=collection,
    field_name="chunk_type",
    field_schema="keyword"
)

client.create_payload_index(
    collection_name=collection,
    field_name="source",
    field_schema="keyword"
)

print("✅ Indexes created successfully! Your queries will now work.")