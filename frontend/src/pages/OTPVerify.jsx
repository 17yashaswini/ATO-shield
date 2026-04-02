import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function OTPVerify() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { username, risk_score, risk_level } = location.state || {};

  async function handleVerify() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("https://ato-shield.onrender.com/api/auth/verify-otp", {
        username,
        otp,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  const riskColor = { LOW: "#00ff99", MEDIUM: "#ffaa00", HIGH: "#ff4466" };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <span style={styles.lockIcon}>🔐</span>
        <h1 style={styles.title}>MFA Required</h1>
        <p style={styles.subtitle}>
          Suspicious login detected. Please verify with the OTP sent to your email.
        </p>

        <div style={{
          ...styles.riskBadge,
          borderColor: riskColor[risk_level],
          color: riskColor[risk_level]
        }}>
          <span>{risk_level} RISK</span>
          <span>Score: {risk_score}/100</span>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>📨 OTP has been sent to your registered email</p>
          <p style={styles.infoNote}>Check your inbox (and spam folder). Expires in 5 minutes.</p>
        </div>

        <input
          style={styles.otpInput}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          maxLength={6}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <button style={styles.backBtn} onClick={() => navigate("/login")}>
          ← Back to Login
        </button>
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
    border: "1px solid #ffaa0030",
    borderRadius: "16px",
    padding: "40px",
    width: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 0 40px #ffaa0010",
  },
  lockIcon: { fontSize: "48px" },
  title: { color: "#ffaa00", margin: 0, fontSize: "24px" },
  subtitle: { color: "#888", margin: 0, fontSize: "13px", textAlign: "center" },
  riskBadge: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "10px 20px",
    display: "flex",
    gap: "24px",
    fontWeight: "bold",
    fontSize: "14px",
    width: "100%",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },
  infoBox: {
    background: "#1a1a2e",
    border: "1px solid #ffffff10",
    borderRadius: "10px",
    padding: "16px",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  },
  infoText: { color: "#ffaa00", margin: "0 0 6px 0", fontSize: "13px" },
  infoNote: { color: "#555", fontSize: "11px", margin: 0 },
  otpInput: {
    background: "#1a1a2e",
    border: "1px solid #ffaa0030",
    borderRadius: "8px",
    padding: "14px",
    color: "#fff",
    fontSize: "20px",
    outline: "none",
    width: "100%",
    textAlign: "center",
    letterSpacing: "6px",
    fontFamily: "monospace",
    boxSizing: "border-box",
  },
  button: {
    background: "#ffaa00",
    color: "#0a0a0f",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    width: "100%",
  },
  backBtn: {
    background: "transparent",
    color: "#888",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  error: { color: "#ff4466", margin: 0, fontSize: "14px" },
};