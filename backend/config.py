import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/atoshield")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey123")
FLASK_ENV = os.getenv("FLASK_ENV", "development")