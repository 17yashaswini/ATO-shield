import hashlib
import json

def extract_features(biometric_data):
    keystrokes = biometric_data.get("keystrokes", [])

    dwell_times = [k.get("dwellTime", 0) for k in keystrokes]
    flight_times = [k.get("flightTime", 0) for k in keystrokes]

    avg_dwell = sum(dwell_times) / len(dwell_times) if dwell_times else 0
    avg_flight = sum(flight_times) / len(flight_times) if flight_times else 0
    max_dwell = max(dwell_times) if dwell_times else 0
    min_flight = min(flight_times) if flight_times else 0
    total_time = biometric_data.get("totalTime", 0)

    fp = biometric_data.get("deviceFingerprint", {})
    screen_width = fp.get("screenWidth", 0)
    screen_height = fp.get("screenHeight", 0)
    touch = 1 if fp.get("touchSupport", False) else 0

    return [
        avg_dwell, avg_flight, max_dwell, min_flight,
        total_time, len(keystrokes),
        screen_width, screen_height, touch,
    ]


def get_device_hash(biometric_data):
    fp = biometric_data.get("deviceFingerprint", {})
    fp_str = json.dumps(fp, sort_keys=True)
    return hashlib.sha256(fp_str.encode()).hexdigest()


def extract_device_flags(biometric_data, known_device_hash=None):
    current_hash = get_device_hash(biometric_data)
    new_device = (known_device_hash != current_hash) if known_device_hash else False

    return {
        "new_device": new_device,
        "unusual_time": biometric_data.get("unusualTime", False),
        "device_hash": current_hash,
    }