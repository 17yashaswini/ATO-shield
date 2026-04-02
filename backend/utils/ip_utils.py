import requests

def get_ip_info(ip):
    """
    Gets location info from IP using free ip-api.com
    Returns country, city, lat, lon, ISP, VPN flag
    """
    try:
        if ip in ["127.0.0.1", "localhost", "::1"]:
            # Local dev — return mock data
            return {
                "country": "India",
                "city": "Bengaluru",
                "lat": 12.9716,
                "lon": 77.5946,
                "isp": "Local",
                "is_vpn": False,
                "ip": ip
            }
        res = requests.get(
            f"http://ip-api.com/json/{ip}?fields=status,country,city,lat,lon,isp,proxy,hosting",
            timeout=3
        )
        data = res.json()
        if data.get("status") == "success":
            return {
                "country": data.get("country", "Unknown"),
                "city": data.get("city", "Unknown"),
                "lat": data.get("lat", 0),
                "lon": data.get("lon", 0),
                "isp": data.get("isp", "Unknown"),
                "is_vpn": data.get("proxy", False) or data.get("hosting", False),
                "ip": ip
            }
    except:
        pass
    return {
        "country": "Unknown",
        "city": "Unknown",
        "lat": 0, "lon": 0,
        "isp": "Unknown",
        "is_vpn": False,
        "ip": ip
    }


def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Haversine formula — distance between two coordinates"""
    from math import radians, sin, cos, sqrt, atan2
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))