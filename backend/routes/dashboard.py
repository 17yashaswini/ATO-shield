from flask import Blueprint, jsonify, request
from database import db

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/", methods=["GET"])
def dashboard():
    return jsonify({"message": "Dashboard route working ✅"})

@dashboard_bp.route("/events", methods=["GET"])
def get_events():
    username = request.args.get("username")
    events = list(db.login_events.find(
        {"username": username},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20))
    for e in events:
        if "timestamp" in e:
            e["timestamp"] = e["timestamp"].isoformat()
    return jsonify({"events": events})