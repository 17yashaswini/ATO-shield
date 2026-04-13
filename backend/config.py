import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI") or os.getenv("MONGO_URI")
JWT_SECRET = os.environ.get("JWT_SECRET", "supersecretkey123")
FLASK_ENV = os.environ.get("FLASK_ENV", "development")

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set!")