from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://ato-shield-8hpd-xi.vercel.app", "http://localhost:3000"], 
     supports_credentials=True)

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.admin import admin_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(admin_bp, url_prefix="/api/admin")

@app.route("/")
def index():
    return {"message": "ATO Shield backend is running 🚀"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)