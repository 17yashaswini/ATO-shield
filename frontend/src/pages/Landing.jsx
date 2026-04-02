import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.center}>
        <h1 style={styles.title}>🛡️ ATO Shield</h1>
        <p style={styles.subtitle}>Account Takeover Detection System</p>

        <div style={styles.cards}>
          <div style={styles.card} onClick={() => navigate("/login")}>
            <span style={styles.icon}>👤</span>
            <h2 style={styles.cardTitle}>User</h2>
            <p style={styles.cardDesc}>Login or register as a user</p>
            <button style={styles.userBtn}>Enter as User</button>
          </div>

          <div style={styles.card} onClick={() => navigate("/admin")}>
            <span style={styles.icon}>⚙️</span>
            <h2 style={styles.cardTitle}>Admin</h2>
            <p style={styles.cardDesc}>Manage users and monitor threats</p>
            <button style={styles.adminBtn}>Enter as Admin</button>
          </div>
        </div>
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
  center: {
    textAlign: "center",
  },
  title: {
    color: "#00ff99",
    fontSize: "42px",
    margin: "0 0 8px 0",
  },
  subtitle: {
    color: "#888",
    fontSize: "15px",
    marginBottom: "60px",
  },
  cards: {
    display: "flex",
    gap: "32px",
    justifyContent: "center",
  },
  card: {
    background: "#12121a",
    border: "1px solid #ffffff15",
    borderRadius: "20px",
    padding: "40px 48px",
    width: "220px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    transition: "transform 0.2s",
  },
  icon: { fontSize: "48px" },
  cardTitle: { color: "#fff", margin: 0, fontSize: "22px" },
  cardDesc: { color: "#888", margin: 0, fontSize: "13px", textAlign: "center" },
  userBtn: {
    marginTop: "8px",
    background: "#00ff99",
    color: "#0a0a0f",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
  },
  adminBtn: {
    marginTop: "8px",
    background: "transparent",
    color: "#ff4466",
    border: "1px solid #ff4466",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
    width: "100%",
  },
};