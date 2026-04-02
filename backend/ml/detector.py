from sklearn.ensemble import IsolationForest
import numpy as np
import pickle
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

def get_model_path(username):
    return os.path.join(MODEL_DIR, f"{username}_model.pkl")

def train_model(username, feature_list):
    """
    Train a per-user Isolation Forest model.
    feature_list = list of feature arrays from past logins
    """
    X = np.array(feature_list)
    model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
    model.fit(X)
    with open(get_model_path(username), "wb") as f:
        pickle.dump(model, f)
    return model

def predict(username, features):
    """
    Predict if a login is anomalous.
    Returns: 1 = normal, -1 = anomaly
    """
    model_path = get_model_path(username)
    if not os.path.exists(model_path):
        return None  # no model yet, not enough data
    with open(model_path, "rb") as f:
        model = pickle.load(f)
    X = np.array([features])
    result = model.predict(X)
    score = model.decision_function(X)[0]
    return {"prediction": int(result[0]), "raw_score": float(score)}