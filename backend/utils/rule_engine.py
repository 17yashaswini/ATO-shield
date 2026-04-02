from datetime import datetime, timedelta
from database import db
import requests

# ── Rule weights (must add context to risk score) ──────────────────
RULE_WEIGHTS = {
    "new_device":         30,
    "vpn_detected":       20,
    "unusual_time":       15,
    "unusual_day":        10,
    "impossible_travel":  40,
    "too_many_failures":  25,
    "new_location":       20,
}

def run_rules(username, ip_address, biometric_data):
    """
    Runs all 7 rules against the current login attempt.
    Returns: { triggered: [...], rule_score: int, flags: {...} }
    """
    triggered = []
    flags = {}

    # 1. New Device
    if biometric_data.get("newDevice", False):
        triggered.append("new_device")
        flags["new_device"] = True

    # 2. Unusual Time (12am - 5am)
    hour = datetime.utcnow().hour
    if hour >= 0 and hour <= 5:
        triggered.append("unusual_time")
        flags["unusual_time"] = True

    # 3. Unusual Day (weekend logins for weekday-only users)
    day = datetime.utcnow().weekday()  # 0=Mon, 6=Sun
    past_logins = list(db.login_events.find({"username": username}))
    if len(past_logins) >= 5:
        past_days = [
            datetime.fromisoformat(str(l["timestamp"])).weekday()
            for l in past_logins if "timestamp" in l
        ]
        weekend_ratio = sum(1 for d in past_days if d >= 5) / len(past_days)
        if day >= 5 and weekend_ratio < 0.1:
            triggered.append("unusual_day")
            flags["unusual_day"] = True

    # 4. Too Many Failed Attempts (last 10 mins)
    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
    failed = db.failed_attempts.count_documents({
        "username": username,
        "timestamp": {"$gt": ten_mins_ago}
    })
    if failed >= 3:
        triggered.append("too_many_failures")
        flags["too_many_failures"] = True

    # 5. VPN / Proxy Detection
    vpn_result = detect_vpn(ip_address)
    if vpn_result:
        triggered.append("vpn_detected")
        flags["vpn_detected"] = True
        flags["ip_info"] = vpn_result

    # 6. New Location
    location = get_location(ip_address)
    if location:
        flags["location"] = location
        past_locations = [
            l.get("location", {}).get("country")
            for l in past_logins if l.get("location")
        ]
        if past_locations and location.get("country") not in past_locations:
            triggered.append("new_location")
            flags["new_location"] = True

    # 7. Impossible Travel
    if past_logins:
        last_login = sorted(past_logins, key=lambda x: x.get("timestamp", ""))[-1]
        last_location = last_login.get("location", {})
        last_time = last_login.get("timestamp")
        if last_location and last_time and location:
            travel_flag = check_impossible_travel(
                last_location, location, last_time
            )
            if travel_flag:
                triggered.append("impossible_travel")
                flags["impossible_travel"] = True

    # Calculate rule score
    rule_score = sum(RULE_WEIGHTS[r] for r in triggered if r in RULE_WEIGHTS)

    return {
        "triggered": triggered,
        "rule_score": min(rule_score, 100),
        "flags": flags
    }


def detect_vpn(ip):
    """Uses ip-api.com free tier to detect VPN/proxy"""
    try:
        if ip in ("127.0.0.1", "localhost", "::1"):
            return None  # local dev, skip
        res = requests.get(
            f"http://ip-api.com/json/{ip}?fields=proxy,hosting,query,org",
            timeout=3
        )
        data = res.json()
        if data.get("proxy") or data.get("hosting"):
            return data
    except:
        pass
    return None


def get_location(ip):
    """Gets country/city from IP"""
    try:
        if ip in ("127.0.0.1", "localhost", "::1"):
            return {"country": "LOCAL", "city": "LOCAL", "ip": ip}
        res = requests.get(
            f"http://ip-api.com/json/{ip}?fields=country,city,lat,lon,query",
            timeout=3
        )
        return res.json()
    except:
        return None


def check_impossible_travel(last_location, current_location, last_time):
    """
    Checks if user traveled impossibly fast between locations.
    Max human travel speed ~900 km/h (plane)
    """
    try:
        from math import radians, sin, cos, sqrt, atan2

        lat1 = last_location.get("lat", 0)
        lon1 = last_location.get("lon", 0)
        lat2 = current_location.get("lat", 0)
        lon2 = current_location.get("lon", 0)

        # Haversine formula
        R = 6371  # Earth radius in km
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
        distance_km = 2 * R * atan2(sqrt(a), sqrt(1 - a))

        # Time difference in hours
        if isinstance(last_time, str):
            last_dt = datetime.fromisoformat(last_time)
        else:
            last_dt = last_time
        hours_elapsed = max((datetime.utcnow() - last_dt).total_seconds() / 3600, 0.01)

        speed = distance_km / hours_elapsed
        return speed > 900  # faster than a plane = impossible
    except:
        return False