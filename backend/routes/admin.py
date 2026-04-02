from flask import Blueprint, jsonify, request
from database import db
from config import JWT_SECRET
import jwt

admin_bp = Blueprint("admin", __name__)

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def verify_admin(req):
    token = req.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("role") == "admin"
    except:
        return False

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.json
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        token = jwt.encode(
            {"username": "admin", "role": "admin"},
            JWT_SECRET, algorithm="HS256"
        )
        return jsonify({"token": token})
    return jsonify({"error": "Invalid admin credentials"}), 401

@admin_bp.route("/users", methods=["GET"])
def get_users():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    users = list(db.users.find({}, {"_id": 0}))
    for u in users:
        if "password" in u:
            u["password"] = u["password"].decode("utf-8") if isinstance(u["password"], bytes) else u["password"]
    return jsonify({"users": users})

@admin_bp.route("/events", methods=["GET"])
def get_all_events():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    events = list(db.login_events.find({}, {"_id": 0}).sort("timestamp", -1))
    for e in events:
        if "timestamp" in e:
            e["timestamp"] = e["timestamp"].isoformat()
        # Clean up features list (too big to show)
        e.pop("features", None)
    return jsonify({"events": events})

@admin_bp.route("/delete-user", methods=["DELETE"])
def delete_user():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    username = request.json.get("username")
    db.users.delete_one({"username": username})
    db.login_events.delete_many({"username": username})
    return jsonify({"message": f"User {username} deleted"})

@admin_bp.route("/stats", methods=["GET"])
def get_stats():
    if not verify_admin(request):
        return jsonify({"error": "Unauthorized"}), 403
    total_users = db.users.count_documents({})
    total_logins = db.login_events.count_documents({})
    blocked = db.login_events.count_documents({"risk_level": "HIGH"})
    safe = db.login_events.count_documents({"risk_level": "LOW"})
    medium = db.login_events.count_documents({"risk_level": "MEDIUM"})
    return jsonify({
        "total_users": total_users,
        "total_logins": total_logins,
        "blocked": blocked,
        "safe": safe,
        "medium": medium
    })