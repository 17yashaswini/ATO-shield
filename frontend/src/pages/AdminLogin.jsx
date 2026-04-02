import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/admin/login", {
        username, password
      });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError("Invalid admin credentials");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚙️ Admin Panel</h1>
        <p style={styles.subtitle}>ATO Shield — Admin Access</p>
        <input style={styles.input} placeholder="Admin Username"
          value={username} onChange={e => setUsername(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Admin Password"
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} onClick={handleLogin}>Login as Admin</button>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { background: "#12121a", border: "1px solid #ff446630", borderRadius: "16px", padding: "40px", width: "380px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 0 40px #ff446610" },
  title: { color: "#ff4466", textAlign: "center", margin: 0, fontSize: "28px" },
  subtitle: { color: "#888", textAlign: "center", margin: 0, fontSize: "13px" },
  input: { background: "#1a1a2e", border: "1px solid #ff446630", borderRadius: "8px", padding: "12px 16px", color: "#fff", fontSize: "15px", outline: "none" },
  button: { background: "#ff4466", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" },
  error: { color: "#ff4466", textAlign: "center", margin: 0, fontSize: "14px" },
};