import os
from qdrant_client import QdrantClient
from qdrant_client.models import PayloadSchemaType
from dotenv import load_dotenv

load_dotenv()

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

collection = "ragner_master_collection"

print("Fixing indexes...")

# 1. The MISSING index that caused your 400 Bad Request error
client.create_payload_index(
    collection_name=collection,
    field_name="project_name",
    field_schema=PayloadSchemaType.KEYWORD
)

# 2. Re-verify the other two just in case
client.create_payload_index(
    collection_name=collection,
    field_name="chunk_type",
    field_schema=PayloadSchemaType.KEYWORD
)

client.create_payload_index(
    collection_name=collection,
    field_name="source",
    field_schema=PayloadSchemaType.KEYWORD
)

print("✅ Indexes created successfully! Your queries will now work.")