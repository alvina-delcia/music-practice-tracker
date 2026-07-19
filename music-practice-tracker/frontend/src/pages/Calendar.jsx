import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import SessionCard, { formatDuration } from "../components/SessionCard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const Calendar = () => {
  const [cursor, setCursor] = useState(new Date()); // month currently displayed
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const res = await api.get("/sessions");
        setSessions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // Map "YYYY-M-D" -> minutes practiced that day, for quick lookup
  const practiceByDay = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = { minutes: 0, sessions: [] };
      map[key].minutes += s.duration;
      map[key].sessions.push(s);
    });
    return map;
  }, [sessions]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const changeMonth = (delta) => {
    setCursor(new Date(year, month + delta, 1));
    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    setSelectedDay(day);
  };

  const selectedKey = selectedDay !== null ? `${year}-${month}-${selectedDay}` : null;
  const selectedData = selectedKey ? practiceByDay[selectedKey] : null;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Practice history</span>
          <h1>Calendar</h1>
          <p className="subtitle">See which days you showed up for practice.</p>
        </div>
      </div>

      <div className="card">
        <div className="flex-between">
          <div className="calendar-nav">
            <button className="icon-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
              ‹
            </button>
            <span className="calendar-month-label">
              {MONTH_NAMES[month]} {year}
            </span>
            <button className="icon-btn" onClick={() => changeMonth(1)} aria-label="Next month">
              ›
            </button>
          </div>
          <button className="btn btn-ghost" onClick={() => setCursor(new Date())}>
            Today
          </button>
        </div>

        {loading ? (
          <p className="loading-text">Loading calendar...</p>
        ) : (
          <>
            <div className="calendar-grid">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="calendar-weekday">
                  {wd}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
                const key = `${year}-${month}-${day}`;
                const hasPractice = Boolean(practiceByDay[key]);
                return (
                  <button
                    key={key}
                    className={`calendar-cell ${hasPractice ? "has-practice" : ""} ${
                      isToday(day) ? "today" : ""
                    }`}
                    onClick={() => handleDayClick(day)}
                    style={{ border: isToday(day) ? undefined : "none" }}
                  >
                    {day}
                    {hasPractice && <span className="calendar-dot" />}
                  </button>
                );
              })}
            </div>

            <div className="calendar-legend">
              <span>
                <span className="legend-swatch" style={{ background: "var(--color-surface-alt)" }} />
                No practice
              </span>
              <span>
                <span
                  className="legend-swatch"
                  style={{
                    background: "linear-gradient(160deg, var(--color-primary-soft), var(--color-accent-soft))",
                  }}
                />
                Practiced
              </span>
            </div>
          </>
        )}
      </div>

      {selectedDay && (
        <div className="day-detail">
          <div className="flex-between mb-16">
            <h3>
              {MONTH_NAMES[month]} {selectedDay}, {year}
            </h3>
            {selectedData && (
              <span className="duration-pill">{formatDuration(selectedData.minutes)} total</span>
            )}
          </div>

          {selectedData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedData.sessions.map((s) => (
                <SessionCard key={s._id} session={s} />
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <div className="empty-state-icon">♪</div>
              <h3>No practice logged</h3>
              <p>Nothing recorded for this day.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Calendar;
