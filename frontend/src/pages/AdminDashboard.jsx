import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    fetchAll();
  }, []);

  async function fetchAll() {
    const [s, u, e] = await Promise.all([
      axios.get("http://127.0.0.1:5000/api/admin/stats", { headers }),
      axios.get("http://127.0.0.1:5000/api/admin/users", { headers }),
      axios.get("http://127.0.0.1:5000/api/admin/events", { headers }),
    ]);
    setStats(s.data);
    setUsers(u.data.users);
    setEvents(e.data.events);
  }

  async function deleteUser(username) {
    if (!window.confirm(`Delete user ${username}?`)) return;
    await axios.delete("http://127.0.0.1:5000/api/admin/delete-user", {
      headers, data: { username }
    });
    fetchAll();
  }

  function logout() {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  }

  const riskColor = { LOW: "#00ff99", MEDIUM: "#ffaa00", HIGH: "#ff4466" };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ ATO Shield — Admin Panel</h1>
        <button style={styles.logout} onClick={logout}>Logout</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "users", "events"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}>
            {tab === "overview" ? "📊 Overview" : tab === "users" ? "👥 Users" : "🕒 Events"}
          </button>
        ))}
      </div>

      <div style={styles.content}>

        {/* OVERVIEW */}
        {activeTab === "overview" && stats && (
          <div>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <p style={styles.statLabel}>Total Users</p>
                <p style={styles.statValue}>{stats.total_users}</p>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#00ff9940" }}>
                <p style={styles.statLabel}>Total Logins</p>
                <p style={{ ...styles.statValue, color: "#00ff99" }}>{stats.total_logins}</p>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#ff446640" }}>
                <p style={styles.statLabel}>Blocked (HIGH)</p>
                <p style={{ ...styles.statValue, color: "#ff4466" }}>{stats.blocked}</p>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#ffaa0040" }}>
                <p style={styles.statLabel}>Medium Risk</p>
                <p style={{ ...styles.statValue, color: "#ffaa00" }}>{stats.medium}</p>
              </div>
              <div style={{ ...styles.statCard, borderColor: "#00ff9940" }}>
                <p style={styles.statLabel}>Safe Logins</p>
                <p style={{ ...styles.statValue, color: "#00ff99" }}>{stats.safe}</p>
              </div>
            </div>

            {/* Recent HIGH risk */}
            <h2 style={styles.sectionTitle}>🚨 Recent Blocked Attempts</h2>
            {events.filter(e => e.risk_level === "HIGH").slice(0, 5).map((e, i) => (
              <div key={i} style={styles.alertCard}>
                <span style={{ color: "#ff4466", fontWeight: "bold" }}>👤 {e.username}</span>
                <span style={{ color: "#ff4466" }}>Score: {e.risk_score}/100</span>
                <span style={styles.time}>{new Date(e.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <div>
            <h2 style={styles.sectionTitle}>👥 All Registered Users</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Password Hash</th>
                  <th style={styles.th}>Device Hash</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}>{u.username}</td>
                    <td style={{ ...styles.td, ...styles.hash }}>{u.password?.slice(0, 30)}...</td>
                    <td style={{ ...styles.td, ...styles.hash }}>{u.device_hash?.slice(0, 20) || "—"}...</td>
                    <td style={styles.td}>
                      <button style={styles.deleteBtn} onClick={() => deleteUser(u.username)}>
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* EVENTS */}
        {activeTab === "events" && (
          <div>
            <h2 style={styles.sectionTitle}>🕒 All Login Events</h2>
            <table style={styles.table}>
              <thead>
  <tr>
    <th style={styles.th}>Username</th>
    <th style={styles.th}>Risk Level</th>
    <th style={styles.th}>Score</th>
    <th style={styles.th}>IP</th>
    <th style={styles.th}>Location</th>
    <th style={styles.th}>VPN</th>
    <th style={styles.th}>Rules Triggered</th>
    <th style={styles.th}>Timestamp</th>
  </tr>
</thead>
              <tbody>
  {events.map((e, i) => (
    <tr key={i} style={styles.tr}>
      <td style={styles.td}>{e.username}</td>
      <td style={{ ...styles.td, color: riskColor[e.risk_level], fontWeight: "bold" }}>
        {e.risk_level}
      </td>
      <td style={styles.td}>{e.risk_score}/100</td>
      <td style={styles.td}>{e.ip || "—"}</td>
      <td style={styles.td}>
        {e.location ? `${e.location.city}, ${e.location.country}` : "LOCAL"}
      </td>
      <td style={styles.td}>
        {e.vpn_detected ? <span style={{color: "#ff4466"}}>⚠️ VPN</span> : "—"}
      </td>
      <td style={styles.td}>
        {e.rules_triggered?.length > 0
          ? e.rules_triggered.join(", ")
          : "none"}
      </td>
      <td style={styles.td}>{new Date(e.timestamp).toLocaleString()}</td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0a0a0f", color: "#fff" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #ff446620" },
  title: { color: "#ff4466", margin: 0, fontSize: "20px" },
  logout: { background: "transparent", border: "1px solid #ff4466", color: "#ff4466", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", fontSize: "14px" },
  tabs: { display: "flex", gap: "0", borderBottom: "1px solid #ffffff10", padding: "0 40px" },
  tab: { background: "transparent", border: "none", color: "#888", padding: "16px 24px", cursor: "pointer", fontSize: "14px", borderBottom: "2px solid transparent" },
  activeTab: { color: "#ff4466", borderBottom: "2px solid #ff4466" },
  content: { padding: "40px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" },
  statCard: { background: "#12121a", border: "1px solid #ffffff15", borderRadius: "12px", padding: "20px", textAlign: "center" },
  statLabel: { color: "#888", margin: "0 0 8px 0", fontSize: "12px" },
  statValue: { color: "#fff", margin: 0, fontSize: "28px", fontWeight: "bold" },
  sectionTitle: { color: "#ff4466", marginBottom: "16px" },
  alertCard: { background: "#1a0a0f", border: "1px solid #ff446620", borderRadius: "10px", padding: "16px 20px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  time: { color: "#888", fontSize: "13px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { color: "#888", padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #ffffff10", fontSize: "13px" },
  tr: { borderBottom: "1px solid #ffffff08" },
  td: { padding: "14px 16px", color: "#ccc", fontSize: "14px" },
  hash: { fontFamily: "monospace", fontSize: "12px", color: "#555" },
  deleteBtn: { background: "transparent", border: "1px solid #ff4466", color: "#ff4466", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" },
};