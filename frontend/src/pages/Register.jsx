import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axios.post("https://ato-shield-backend.onrender.com/api/auth/register", {
        username,
        email,
        password,
      });
      setSuccess("Registered! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🛡️ ATO Shield</h1>
        <p style={styles.subtitle}>Create your account</p>

        <input style={styles.input} placeholder="Username"
          value={username} onChange={e => setUsername(e.target.value)} />
        <input style={styles.input} placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <button style={styles.button} onClick={handleRegister} disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p style={styles.link}>
          Already have an account?{" "}
          <Link to="/login" style={styles.linkText}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "#12121a", border: "1px solid #00ff9920", borderRadius: "16px", padding: "40px", width: "380px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 0 40px #00ff9910" },
  title: { color: "#00ff99", textAlign: "center", margin: 0, fontSize: "28px" },
  subtitle: { color: "#888", textAlign: "center", margin: 0, fontSize: "13px" },
  input: { background: "#1a1a2e", border: "1px solid #00ff9930", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "15px", outline: "none" },
  button: { background: "#00ff99", color: "#0a0a0f", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "4px" },
  error: { color: "#ff4466", textAlign: "center", margin: 0, fontSize: "14px" },
  success: { color: "#00ff99", textAlign: "center", margin: 0, fontSize: "14px" },
  link: { color: "#888", textAlign: "center", margin: 0, fontSize: "14px" },
  linkText: { color: "#00ff99", textDecoration: "none" },
};