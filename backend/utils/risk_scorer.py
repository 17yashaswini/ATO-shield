def calculate_risk_score(prediction_result, device_flags=None, rule_result=None):
    """
    Final risk score = weighted combination of ML + Rules
    Weights: 40% keystroke ML, 35% device/rules, 25% behavioral patterns
    """
    ml_score = 0
    rule_score = 0

    # ML component (40%)
    if prediction_result is None:
        ml_score = 40  # new user, no model yet
    else:
        raw_score = prediction_result["raw_score"]
        prediction = prediction_result["prediction"]
        ml_score = max(0, min(100, int((0.5 - raw_score) * 100)))
        if prediction == -1:
            ml_score = max(ml_score, 70)

    # Rule-based component (60%)
    if rule_result:
        rule_score = rule_result.get("rule_score", 0)

    # Extra device flags
    if device_flags:
        if device_flags.get("new_device"):
            rule_score = min(100, rule_score + 15)
        if device_flags.get("unusual_time"):
            rule_score = min(100, rule_score + 10)

    # Weighted final score
    final_score = int((ml_score * 0.40) + (rule_score * 0.60))
    return min(final_score, 100)


def get_risk_level(score):
    if score < 30:
        return "LOW"
    elif score < 60:
        return "MEDIUM"
    else:
        return "HIGH"