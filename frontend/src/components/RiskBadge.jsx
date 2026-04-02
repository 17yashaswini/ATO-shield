export default function RiskBadge({ score, level }) {
  const colors = {
    LOW: "#00ff99",
    MEDIUM: "#ffaa00",
    HIGH: "#ff4466",
  };

  return (
    <div style={{ ...styles.badge, borderColor: colors[level], color: colors[level] }}>
      <span style={styles.level}>{level} RISK</span>
      <span style={styles.score}>Score: {score}/100</span>
    </div>
  );
}

const styles = {
  badge: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "10px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  level: {
    fontWeight: "bold",
    fontSize: "14px",
  },
  score: {
    fontSize: "13px",
  },
};