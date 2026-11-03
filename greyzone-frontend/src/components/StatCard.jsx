function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color = "cyan",
  description,
}) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-top">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <h2 className="stat-card-value">{value}</h2>
        </div>

        <div className={`stat-icon ${color}`}>
          {Icon && <Icon size={21} />}
        </div>
      </div>

      <div className="stat-card-bottom">
        <span className="stat-change">{change}</span>
        <span>{description}</span>
      </div>
    </div>
  );
}

export default StatCard;