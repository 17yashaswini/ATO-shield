import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { createBiometricTracker } from "../utils/biometrics";
import RiskBadge from "../components/RiskBadge";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const tracker = useRef(createBiometricTracker());
  const navigate = useNavigate();

  useEffect(() => {
    tracker.current.reset();
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError("");
    setRiskData(null);

    const biometrics = tracker.current.getFeatures();

    try {
      const res = await axios.post("https://ato-shield-backend.onrender.com/api/auth/login", {
        username,
        password,
        biometrics,
      });

      setRiskData({
        score: res.data.risk_score,
        level: res.data.risk_level,
      });

      if (res.data.mfa_required) {
        navigate("/verify-otp", {
          state: {
            username,
            risk_score: res.data.risk_score,
            risk_level: res.data.risk_level,
          },
        });
      } else {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("username", username);
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || "Login failed");
      if (data?.risk_score) {
        setRiskData({ score: data.risk_score, level: data.risk_level });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🛡️ ATO Shield</h1>
        <p style={styles.subtitle}>Behavioral Biometric Authentication</p>

        <input
          style={styles.input}
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => tracker.current.onKeyDown(e)}
          onKeyUp={(e) => tracker.current.onKeyUp(e)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => tracker.current.onKeyDown(e)}
          onKeyUp={(e) => tracker.current.onKeyUp(e)}
        />

        {error && <p style={styles.error}>{error}</p>}
        {riskData && <RiskBadge score={riskData.score} level={riskData.level} />}

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? "Analyzing..." : "Login"}
        </button>

        <p style={styles.link}>
          No account?{" "}
          <Link to="/register" style={styles.linkText}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "#12121a",
    border: "1px solid #00ff9920",
    borderRadius: "16px",
    padding: "40px",
    width: "380px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxShadow: "0 0 40px #00ff9910",
  },
  title: {
    color: "#00ff99",
    textAlign: "center",
    margin: 0,
    fontSize: "28px",
  },
  subtitle: {
    color: "#888",
    textAlign: "center",
    margin: 0,
    fontSize: "13px",
  },
  input: {
    background: "#1a1a2e",
    border: "1px solid #00ff9930",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    background: "#00ff99",
    color: "#0a0a0f",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "4px",
  },
  error: {
    color: "#ff4466",
    textAlign: "center",
    margin: 0,
    fontSize: "14px",
  },
  link: {
    color: "#888",
    textAlign: "center",
    margin: 0,
    fontSize: "14px",
  },
  linkText: {
    color: "#00ff99",
    textDecoration: "none",
  },
};