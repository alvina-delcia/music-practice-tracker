import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import SessionCard, { formatDuration } from "../components/SessionCard";
import CircularProgress from "../components/CircularProgress";
import { getInstrumentIcon } from "../utils/instrumentIcons";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Duration tiers used to color-code each practiced day
const getTier = (minutes) => {
  if (minutes <= 0) return "none";
  if (minutes <= 30) return "light";
  if (minutes <= 60) return "medium";
  return "heavy";
};

const Calendar = () => {
  const [cursor, setCursor] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [sessionsRes, goalRes] = await Promise.all([api.get("/sessions"), api.get("/goals")]);
        setSessions(sessionsRes.data);
        setGoal(goalRes.data);
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
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const selectedKey = selectedDay !== null ? `${year}-${month}-${selectedDay}` : null;
  const selectedData = selectedKey ? practiceByDay[selectedKey] : null;

  // ---- Activity summary panel calculations ----
  const monthStats = useMemo(() => {
    const thisMonthSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const totalMinutes = thisMonthSessions.reduce((sum, s) => sum + s.duration, 0);

    const prevMonthDate = new Date(year, month - 1, 1);
    const prevMonthSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === prevMonthDate.getFullYear() && d.getMonth() === prevMonthDate.getMonth();
    });
    const prevMonthMinutes = prevMonthSessions.reduce((sum, s) => sum + s.duration, 0);

    let trendPercent = null;
    if (prevMonthMinutes > 0) {
      trendPercent = Math.round(((totalMinutes - prevMonthMinutes) / prevMonthMinutes) * 100);
    } else if (totalMinutes > 0) {
      trendPercent = 100;
    }

    return { totalMinutes, sessionCount: thisMonthSessions.length, trendPercent };
  }, [sessions, year, month]);

  const streak = useMemo(() => {
    const practicedDays = new Set(sessions.map((s) => new Date(s.date).toDateString()));
    let count = 0;
    const cursorDate = new Date();
    while (practicedDays.has(cursorDate.toDateString())) {
      count += 1;
      cursorDate.setDate(cursorDate.getDate() - 1);
    }
    return count;
  }, [sessions]);

  const suggestedFocus = useMemo(() => {
    if (sessions.length === 0) return null;
    const lastPracticed = {};
    sessions.forEach((s) => {
      const d = new Date(s.date);
      if (!lastPracticed[s.instrument] || d > lastPracticed[s.instrument]) {
        lastPracticed[s.instrument] = d;
      }
    });
    const entries = Object.entries(lastPracticed);
    if (entries.length <= 1) return null;
    entries.sort((a, b) => a[1] - b[1]); // oldest last-practiced first
    const [instrument, lastDate] = entries[0];
    const daysSince = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
    if (daysSince < 2) return null;
    return { instrument, daysSince };
  }, [sessions]);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Practice history</span>
          <h1>
            Calendar <span style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)", opacity: 0.6, fontSize: 22 }}>♪</span>
          </h1>
          <p className="subtitle">See which days you showed up for practice.</p>
        </div>
      </div>

      <div className="calendar-page-grid">
        <div>
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
                    const data = practiceByDay[key];
                    const tier = getTier(data?.minutes || 0);
                    const mainInstrument = data?.sessions?.[0]?.instrument;
                    const tooltip = data
                      ? `Practiced ${formatDuration(data.minutes)} ${getInstrumentIcon(mainInstrument)}`
                      : null;

                    return (
                      <button
                        key={key}
                        className={`calendar-cell tier-${tier} ${isToday(day) ? "today" : ""} ${
                          selectedDay === day ? "selected" : ""
                        }`}
                        onClick={() => handleDayClick(day)}
                        data-tooltip={tooltip}
                      >
                        <span className="calendar-cell-day">{day}</span>
                        {data && (
                          <>
                            <span className="calendar-cell-duration">{formatDuration(data.minutes)}</span>
                            <span className="calendar-cell-instrument">
                              <span className={`calendar-cell-dot dot-${tier}`} />
                              {mainInstrument}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="calendar-legend">
                  <span>
                    <span className="legend-swatch dot-light" />
                    0-30 mins
                  </span>
                  <span>
                    <span className="legend-swatch dot-medium" />
                    31-60 mins
                  </span>
                  <span>
                    <span className="legend-swatch dot-heavy" />
                    1h+
                  </span>
                  <span>
                    <span className="legend-swatch" style={{ background: "var(--color-surface-alt)" }} />
                    No practice
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
        </div>

        <aside className="activity-summary">
          <div className="summary-card">
            <div className="summary-card-title">
              <span>📊</span> Activity Summary
            </div>
            <div className="summary-stat-label">Total Practice</div>
            <div className="summary-stat-value">{formatDuration(monthStats.totalMinutes)}</div>
            {monthStats.trendPercent !== null && (
              <div className={`summary-trend ${monthStats.trendPercent >= 0 ? "trend-up" : "trend-down"}`}>
                {monthStats.trendPercent >= 0 ? "↑" : "↓"} {Math.abs(monthStats.trendPercent)}% vs last month
              </div>
            )}
          </div>

          <div className="summary-card summary-streak-card">
            <div className="summary-card-title">
              <span>🔥</span> Practice Streak
            </div>
            <div className="summary-streak-row">
              <div>
                <div className="summary-streak-number">{streak}</div>
                <div className="summary-stat-label" style={{ marginTop: 0 }}>
                  days
                </div>
                <div className="summary-trend" style={{ marginTop: 8 }}>
                  {streak > 0 ? "Keep it up! 🔥" : "Practice today to start"}
                </div>
              </div>
              <CircularProgress
                percent={Math.min(100, (streak / 14) * 100)}
                size={72}
                strokeWidth={8}
                gradientId="streakRing"
                centerContent={<span style={{ fontSize: 26 }}>🔥</span>}
              />
            </div>
          </div>

          {goal && (
            <div className="summary-card">
              <div className="summary-card-title">
                <span>🎵</span> Up Next
              </div>
              <div className="summary-streak-row">
                <div>
                  <div className="summary-stat-label" style={{ marginTop: 0 }}>
                    Today's goal
                  </div>
                  <div className="summary-stat-value" style={{ fontSize: 22 }}>
                    {formatDuration(goal.progressMinutes)}
                    <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
                      {" "}
                      / {formatDuration(goal.targetMinutes)}
                    </span>
                  </div>
                </div>
                <CircularProgress
                  percent={goal.progressPercent}
                  size={64}
                  strokeWidth={7}
                  gradientId="goalRing"
                />
              </div>
            </div>
          )}

          {suggestedFocus && (
            <div className="summary-card">
              <div className="summary-card-title">
                <span>💡</span> Suggested Focus
              </div>
              <div className="summary-stat-label" style={{ marginTop: 0 }}>
                Haven't touched this in {suggestedFocus.daysSince} days
              </div>
              <div className="summary-stat-value" style={{ fontSize: 18 }}>
                {getInstrumentIcon(suggestedFocus.instrument)} {suggestedFocus.instrument}
              </div>
            </div>
          )}

          <Link to="/sessions" className="summary-card summary-link-card">
            View All Sessions
            <span>›</span>
          </Link>
        </aside>
      </div>
    </Layout>
  );
};

export default Calendar;
