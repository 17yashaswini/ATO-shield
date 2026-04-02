import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("username");
    const t = localStorage.getItem("token");
    if (!t) { navigate("/"); return; }
    setUsername(u);
    fetchEvents(u);
  }, []);

  async function fetchEvents(u) {
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/dashboard/events?username=${u}`
      );
      const data = res.data.events || [];
      setEvents(data);
      calculateStats(data);
    } catch (err) {
      console.error(err);
    }
  }

  function calculateStats(data) {
    if (data.length === 0) return;
    const total = data.length;
    const blocked = data.filter(e => e.risk_level === "HIGH").length;
    const avg = Math.round(data.reduce((a, b) => a + b.risk_score, 0) / total);
    const safe = data.filter(e => e.risk_level === "LOW").length;
    setStats({ total, blocked, avg, safe });
  }

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  const riskColor = { LOW: "#00ff99", MEDIUM: "#ffaa00", HIGH: "#ff4466" };

  const chartData = [...events].reverse().map((e, i) => ({
    login: `#${i + 1}`,
    score: e.risk_score,
  }));

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🛡️ ATO Shield</h1>
        <div style={styles.headerRight}>
          <span style={styles.user}>👤 {username}</span>
          <button style={styles.logout} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Stats Cards */}
        {stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Total Logins</p>
              <p style={styles.statValue}>{stats.total}</p>
            </div>
            <div style={{ ...styles.statCard, borderColor: "#00ff9940" }}>
              <p style={styles.statLabel}>Safe Logins</p>
              <p style={{ ...styles.statValue, color: "#00ff99" }}>{stats.safe}</p>
            </div>
            <div style={{ ...styles.statCard, borderColor: "#ff446640" }}>
              <p style={styles.statLabel}>Blocked Attempts</p>
              <p style={{ ...styles.statValue, color: "#ff4466" }}>{stats.blocked}</p>
            </div>
            <div style={{ ...styles.statCard, borderColor: "#ffaa0040" }}>
              <p style={styles.statLabel}>Avg Risk Score</p>
              <p style={{ ...styles.statValue, color: "#ffaa00" }}>{stats.avg}/100</p>
            </div>
          </div>
        )}

        {/* Risk Chart */}
        {chartData.length > 0 && (
          <div style={styles.chartCard}>
            <h2 style={styles.sectionTitle}>📈 Risk Score Over Time</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="login" stroke="#555" />
                <YAxis domain={[0, 100]} stroke="#555" />
                <Tooltip
                  contentStyle={{ background: "#12121a", border: "1px solid #00ff9930" }}
                  labelStyle={{ color: "#00ff99" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#00ff99"
                  strokeWidth={2}
                  dot={{ fill: "#00ff99", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Alerts */}
        {events.filter(e => e.risk_level === "HIGH").length > 0 && (
          <div style={styles.alertBox}>
            <h2 style={styles.alertTitle}>🚨 High Risk Alerts</h2>
            {events
              .filter(e => e.risk_level === "HIGH")
              .map((e, i) => (
                <div key={i} style={styles.alertCard}>
                  <span style={{ color: "#ff4466", fontWeight: "bold" }}>
                    BLOCKED — Score: {e.risk_score}/100
                  </span>
                  <span style={styles.time}>
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* All Events */}
        <h2 style={styles.sectionTitle}>🕒 Recent Login Events</h2>
        {events.length === 0 ? (
          <p style={styles.empty}>No login events yet.</p>
        ) : (
          events.map((e, i) => (
            <div key={i} style={styles.eventCard}>
              <span style={styles.time}>
                {new Date(e.timestamp).toLocaleString()}
              </span>
              <span style={{ color: riskColor[e.risk_level], fontWeight: "bold" }}>
                {e.risk_level} — {e.risk_score}/100
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0f", color: "#fff" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    borderBottom: "1px solid #00ff9920",
  },
  title: { color: "#00ff99", margin: 0, fontSize: "22px" },
  headerRight: { display: "flex", alignItems: "center", gap: "16px" },
  user: { color: "#888", fontSize: "14px" },
  logout: {
    background: "transparent",
    border: "1px solid #ff4466",
    color: "#ff4466",
    borderRadius: "8px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
  },
  content: { padding: "40px" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  statCard: {
    background: "#12121a",
    border: "1px solid #ffffff15",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  statLabel: { color: "#888", margin: "0 0 8px 0", fontSize: "13px" },
  statValue: { color: "#fff", margin: 0, fontSize: "28px", fontWeight: "bold" },
  chartCard: {
    background: "#12121a",
    border: "1px solid #00ff9920",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
  },
  sectionTitle: { color: "#00ff99", marginBottom: "16px" },
  alertBox: {
    background: "#1a0a0f",
    border: "1px solid #ff446630",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
  },
  alertTitle: { color: "#ff4466", marginBottom: "16px", marginTop: 0 },
  alertCard: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #ff446620",
  },
  empty: { color: "#555" },
  eventCard: {
    background: "#12121a",
    border: "1px solid #00ff9920",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "12px",
    display: "flex",
    justifyContent: "space-between",
  },
  time: { color: "#888", fontSize: "14px" },
};