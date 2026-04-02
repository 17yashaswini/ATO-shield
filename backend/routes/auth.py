from flask import Blueprint, request, jsonify
from config import JWT_SECRET
from database import db
from ml.detector import predict, train_model
from utils.fingerprint import extract_features, extract_device_flags
from utils.risk_scorer import calculate_risk_score, get_risk_level
from utils.rule_engine import run_rules
from utils.mailer import send_otp_email
import bcrypt
import jwt
import datetime
import random
import traceback

auth_bp = Blueprint("auth", __name__)

def generate_otp():
    return str(random.randint(100000, 999999))

def get_recent_failures(username, ip, minutes=10):
    since = datetime.datetime.utcnow() - datetime.timedelta(minutes=minutes)
    return db.failed_attempts.count_documents({
        "$or": [{"username": username}, {"ip": ip}],
        "timestamp": {"$gt": since}
    })

def is_account_locked(username):
    since = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    failures = db.failed_attempts.count_documents({
        "username": username,
        "timestamp": {"$gt": since}
    })
    return failures >= 5

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400
    if db.users.find_one({"username": username}):
        return jsonify({"error": "User already exists"}), 400

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    db.users.insert_one({
        "username": username,
        "password": hashed,
        "email": email
    })
    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    biometric_data = data.get("biometrics", {})
    ip_address = request.remote_addr

    # 0. Check if account is locked
    if is_account_locked(username):
        return jsonify({
            "error": "Account temporarily locked due to too many failed attempts. Try again in 5 minutes."
        }), 429

    # 1. Check credentials
    user = db.users.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        db.failed_attempts.insert_one({
            "username": username,
            "ip": ip_address,
            "timestamp": datetime.datetime.utcnow()
        })
        recent_failures = get_recent_failures(username, ip_address)
        remaining = max(0, 5 - recent_failures)
        return jsonify({
            "error": f"Invalid credentials. {remaining} attempts remaining before lockout."
        }), 401

    # 2. Count recent failures before this successful login
    recent_failures = get_recent_failures(username, ip_address)

    # 3. Extract biometric features
    features = extract_features(biometric_data)
    user_device_hash = user.get("device_hash", None)
    device_flags = extract_device_flags(biometric_data, user_device_hash)

    if not user_device_hash:
        db.users.update_one(
            {"username": username},
            {"$set": {"device_hash": device_flags["device_hash"]}}
        )

    # 4. Run rule-based detection
    rule_result = run_rules(username, ip_address, biometric_data)

    # 5. ML prediction
    prediction_result = predict(username, features)

    # 6. Base risk score
    risk_score = calculate_risk_score(prediction_result, device_flags, rule_result)

    # 7. Boost risk based on failed attempts
    if recent_failures == 1:
        risk_score = max(risk_score, 45)
    elif recent_failures == 2:
        risk_score = max(risk_score, 65)
    elif recent_failures >= 3:
        risk_score = 90

    risk_level = get_risk_level(risk_score)

    # 8. Store login event
    db.login_events.insert_one({
        "username": username,
        "features": features,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "rules_triggered": rule_result["triggered"],
        "ip": ip_address,
        "location": rule_result["flags"].get("location"),
        "vpn_detected": rule_result["flags"].get("vpn_detected", False),
        "failed_attempts_before": recent_failures,
        "timestamp": datetime.datetime.utcnow()
    })

    # 9. Retrain ML model
    past_logins = list(db.login_events.find({"username": username}))
    if len(past_logins) >= 5:
        feature_list = [l["features"] for l in past_logins]
        train_model(username, feature_list)

    # 10. Clear failed attempts on successful login
    db.failed_attempts.delete_many({"username": username})

    # 11. Trigger MFA for MEDIUM/HIGH
    if risk_level in ["MEDIUM", "HIGH"]:
        otp = generate_otp()
        db.otp_store.insert_one({
            "username": username,
            "otp": otp,
            "expires_at": datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        })
        user_email = user.get("email", "")
        try:
            print(f"Sending OTP to: {user_email}")
            send_otp_email(user_email, otp, username, risk_level)
            email_status = f"OTP sent to {user_email[:3]}***@{user_email.split('@')[-1]}"
            print(f"Email sent successfully!")
        except Exception as e:
            traceback.print_exc()
            email_status = f"Email error: {str(e)}"
            print(f"EMAIL FAILED: {str(e)}")

        return jsonify({
            "mfa_required": True,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "rules_triggered": rule_result["triggered"],
            "failed_attempts": recent_failures,
            "message": email_status
        }), 200

    # 12. LOW risk — issue JWT
    token = jwt.encode({
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "rules_triggered": rule_result["triggered"],
        "mfa_required": False
    }), 200


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    username = data.get("username")
    otp_entered = data.get("otp")

    record = db.otp_store.find_one({
        "username": username,
        "otp": otp_entered,
        "expires_at": {"$gt": datetime.datetime.utcnow()}
    })

    if not record:
        return jsonify({"error": "Invalid or expired OTP"}), 401

    db.otp_store.delete_one({"_id": record["_id"]})

    token = jwt.encode({
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, JWT_SECRET, algorithm="HS256")

    return jsonify({
        "token": token,
        "message": "MFA verified successfully ✅"
    }), 200