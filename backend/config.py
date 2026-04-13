from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI") or "mongodb://localhost:27017/atoshield"
print(f"Connecting to MongoDB: {MONGO_URI[:50]}...")

client = MongoClient(MONGO_URI)
db = client["atoshield"]