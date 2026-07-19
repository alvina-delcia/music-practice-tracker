const StatCard = ({ icon, iconBg, label, value, sub }) => {
  return (
    <div className="card stat-card hoverable">
      <div className="stat-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
};

export default StatCard;
