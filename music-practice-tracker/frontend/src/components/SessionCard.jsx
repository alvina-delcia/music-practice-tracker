const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const SessionCard = ({ session, onEdit, onDelete }) => {
  const dateObj = new Date(session.date);

  return (
    <div className="card session-card hoverable">
      <div className="session-date-badge">
        <span className="month">{MONTHS[dateObj.getMonth()]}</span>
        <span className="day">{dateObj.getDate()}</span>
      </div>

      <div className="session-info">
        <div className="session-instrument">{session.instrument}</div>
        <div className="session-meta">
          <span>{dateObj.toLocaleDateString(undefined, { weekday: "long" })}</span>
        </div>
        {session.notes && <div className="session-notes">{session.notes}</div>}
      </div>

      <span className="duration-pill">{formatDuration(session.duration)}</span>

      {(onEdit || onDelete) && (
        <div className="session-actions">
          {onEdit && (
            <button className="icon-btn" onClick={() => onEdit(session)} aria-label="Edit session" title="Edit">
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className="icon-btn danger"
              onClick={() => onDelete(session)}
              aria-label="Delete session"
              title="Delete"
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionCard;
export { formatDuration };
