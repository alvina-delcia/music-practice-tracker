import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import SessionCard, { formatDuration } from "../components/SessionCard";
import CircularProgress from "../components/CircularProgress";
import SessionFormModal from "../components/SessionFormModal";
import { useAuth } from "../context/AuthContext";
import { getInstrumentIcon } from "../utils/instrumentIcons";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [weekHeatmap, setWeekHeatmap] = useState([]);
  const [streak, setStreak] = useState(0);
  const [weekdayBars, setWeekdayBars] = useState([]);
  const [mostPracticed, setMostPracticed] = useState(null);
  const [weekTrend, setWeekTrend] = useState(null);

  const loadData = async () => {
    try {
      const [statsRes, goalRes, sessionsRes] = await Promise.all([
        api.get("/sessions/stats"),
        api.get("/goals"),
        api.get("/sessions"),
      ]);
      setStats(statsRes.data);
      setGoal(goalRes.data);

      const allSessions = sessionsRes.data;

      // Build a map of practiced days for the streak + last-7-days heatmap
      const practicedDays = new Set(allSessions.map((s) => new Date(s.date).toDateString()));

      const today = new Date();
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        last7.push({
          label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
          active: practicedDays.has(d.toDateString()),
        });
      }
      setWeekHeatmap(last7);

      let streakCount = 0;
      const cursor = new Date(today);
      while (practicedDays.has(cursor.toDateString())) {
        streakCount += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      setStreak(streakCount);

      // Current week (Mon-Sun) and previous week date ranges
      const dayOfWeek = today.getDay(); // 0 = Sunday
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setHours(0, 0, 0, 0);
      monday.setDate(today.getDate() - mondayOffset);

      const weekdayTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
      let thisWeekTotal = 0;
      let lastWeekTotal = 0;
      const instrumentTotals = {};

      allSessions.forEach((s) => {
        const d = new Date(s.date);
        const daysFromMonday = Math.floor((d - monday) / (1000 * 60 * 60 * 24));

        if (daysFromMonday >= 0 && daysFromMonday < 7) {
          weekdayTotals[daysFromMonday] += s.duration;
          thisWeekTotal += s.duration;
          instrumentTotals[s.instrument] = (instrumentTotals[s.instrument] || 0) + s.duration;
        } else if (daysFromMonday >= -7 && daysFromMonday < 0) {
          lastWeekTotal += s.duration;
        }
      });

      const maxDay = Math.max(...weekdayTotals, 1);
      setWeekdayBars(
        weekdayTotals.map((minutes, i) => ({
          label: WEEKDAY_LABELS[i],
          minutes,
          heightPercent: (minutes / maxDay) * 100,
        }))
      );

      const topInstrument = Object.entries(instrumentTotals).sort((a, b) => b[1] - a[1])[0];
      setMostPracticed(topInstrument ? { name: topInstrument[0], minutes: topInstrument[1] } : null);

      if (lastWeekTotal > 0) {
        setWeekTrend(Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100));
      } else if (thisWeekTotal > 0) {
        setWeekTrend(100);
      } else {
        setWeekTrend(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSession = async (payload) => {
    await api.post("/sessions", payload);
    setModalOpen(false);
    loadData();
  };

  const firstName = user?.name?.split(" ")[0];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Welcome back, {firstName}</h1>
          <p className="subtitle">Keep the rhythm going, you're doing great!</p>
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              {streak > 0 && (
                <span className="streak-badge">🔥 {streak}-day streak</span>
              )}
              {stats?.todayMinutes > 0 && (
                <span className="encouraging-text">Great job today!</span>
              )}
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add session
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading your dashboard...</p>
      ) : (
        <>
          <div className="card-grid grid-3 mb-16">
            <StatCard
              icon="⏱"
              iconBg="var(--color-primary-soft)"
              label="Total practice time"
              value={formatDuration(stats?.totalMinutes || 0)}
              sub={`${stats?.totalSessions || 0} sessions logged`}
            />
            <StatCard
              icon="☀"
              iconBg="var(--color-accent-soft)"
              label="Today"
              value={formatDuration(stats?.todayMinutes || 0)}
              sub="Practiced so far today"
            />
            <StatCard
              icon="◈"
              iconBg="var(--color-success-soft)"
              label="This week"
              value={formatDuration(stats?.weekMinutes || 0)}
              sub="Since Sunday"
            />
          </div>

          <div className="mini-card-row mb-16">
            <div className="mini-card">
              <div className="mini-card-label">Streak</div>
              <div className="mini-card-value">🔥 {streak}</div>
              <div className="mini-card-sub">{streak > 0 ? "You're on fire!" : "Practice today to start one"}</div>
            </div>

            <div className="mini-card">
              <div className="mini-card-label">This week vs last</div>
              {weekTrend === null ? (
                <>
                  <div className="mini-card-value">—</div>
                  <div className="mini-card-sub">Not enough data yet</div>
                </>
              ) : (
                <>
                  <div className={`mini-card-value ${weekTrend >= 0 ? "trend-up" : "trend-down"}`}>
                    {weekTrend >= 0 ? "+" : ""}
                    {weekTrend}%
                  </div>
                  <div className="mini-card-sub">{weekTrend >= 0 ? "More practice time" : "Less than last week"}</div>
                </>
              )}
            </div>

            <div className="mini-card">
              <div className="mini-card-label">Most practiced</div>
              {mostPracticed ? (
                <>
                  <div className="mini-card-value">
                    {getInstrumentIcon(mostPracticed.name)} {mostPracticed.name}
                  </div>
                  <div className="mini-card-sub">{formatDuration(mostPracticed.minutes)} this week</div>
                </>
              ) : (
                <>
                  <div className="mini-card-value">—</div>
                  <div className="mini-card-sub">Log a session to see this</div>
                </>
              )}
            </div>

            <div className="mini-card">
              <div className="mini-card-label">Last 7 days</div>
              <div className="heatmap-row" style={{ marginTop: 6 }}>
                {weekHeatmap.map((d, i) => (
                  <div key={i} className={`heatmap-cell ${d.active ? "active" : ""}`} style={{ height: 26 }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-grid grid-2" style={{ alignItems: "start" }}>
            <div className="card">
              <div className="flex-between">
                <div>
                  <span className="eyebrow">Current goal</span>
                  <h3 style={{ fontSize: 20 }}>
                    {goal?.targetMinutes ? formatDuration(goal.targetMinutes) : "—"}{" "}
                    <span style={{ color: "var(--color-text-muted)", fontSize: 14, fontWeight: 500 }}>
                      / {goal?.type}
                    </span>
                  </h3>
                </div>
                <Link to="/goals" className="btn btn-ghost">
                  Update goal
                </Link>
              </div>

              {goal && (
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <CircularProgress percent={goal.progressPercent} size={112} strokeWidth={11} />
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
                      {formatDuration(goal.progressMinutes)} of {formatDuration(goal.targetMinutes)}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="weekday-bars">
                      {weekdayBars.map((d, i) => (
                        <div key={i} className="weekday-bar-col" title={formatDuration(d.minutes)}>
                          <div
                            className={`weekday-bar ${d.minutes > 0 ? "has-practice" : ""}`}
                            style={{ height: `${Math.max(d.heightPercent, 4)}%` }}
                          />
                          <span className="weekday-bar-label">{d.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex-between mb-16">
                <span className="eyebrow" style={{ marginBottom: 0 }}>
                  Recent sessions
                </span>
                <Link to="/sessions" className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }}>
                  View all
                </Link>
              </div>

              {stats?.recentSessions?.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stats.recentSessions.map((s) => (
                    <div
                      key={s._id}
                      className="flex-between"
                      style={{ padding: "10px 4px", borderBottom: "1px solid var(--color-border)", gap: 12 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div className="instrument-avatar">{getInstrumentIcon(s.instrument)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.instrument}</div>
                          <div style={{ fontSize: 12.5, color: "var(--color-text-muted)" }}>
                            {new Date(s.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <span className="duration-pill">{formatDuration(s.duration)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "32px 10px" }}>
                  <div className="empty-state-icon">♪</div>
                  <h3>No sessions yet</h3>
                  <p>Log your first practice session to see it here.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <button className="btn-fab" onClick={() => setModalOpen(true)} aria-label="Add session">
        +
      </button>

      <SessionFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddSession} />
    </Layout>
  );
};

export default Dashboard;
