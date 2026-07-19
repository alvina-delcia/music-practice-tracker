import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import WaveformProgress from "../components/WaveformProgress";
import { formatDuration } from "../components/SessionCard";

const Goals = () => {
  const [goal, setGoal] = useState(null);
  const [type, setType] = useState("daily");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const loadGoal = async () => {
    setLoading(true);
    try {
      const res = await api.get("/goals");
      setGoal(res.data);
      setType(res.data.type);
      setHours(String(Math.floor(res.data.targetMinutes / 60)));
      setMinutes(String(res.data.targetMinutes % 60));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoal();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    const targetMinutes = Number(hours || 0) * 60 + Number(minutes || 0);
    if (targetMinutes <= 0) {
      setError("Please set a target greater than 0 minutes.");
      return;
    }

    setSaving(true);
    try {
      await api.put("/goals", { type, targetMinutes });
      await loadGoal();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update goal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Stay consistent</span>
          <h1>Practice goal</h1>
          <p className="subtitle">Set a target and track your progress toward it.</p>
        </div>
      </div>

      <div className="card-grid grid-2" style={{ alignItems: "start" }}>
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 20 }}>Update your goal</h3>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Goal type</label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className={type === "daily" ? "btn btn-primary" : "btn btn-ghost"}
                  onClick={() => setType("daily")}
                  style={{ flex: 1 }}
                >
                  Daily
                </button>
                <button
                  type="button"
                  className={type === "weekly" ? "btn btn-primary" : "btn btn-ghost"}
                  onClick={() => setType("weekly")}
                  style={{ flex: 1 }}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Target duration</label>
              <div className="form-row">
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  aria-label="Hours"
                />
                <input
                  type="number"
                  className="input"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  aria-label="Minutes"
                />
              </div>
              <span className="hint">Hours and minutes per {type === "daily" ? "day" : "week"}</span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save goal"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 4 }}>Your progress</h3>
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : goal ? (
            <>
              <p className="subtitle" style={{ marginBottom: 20 }}>
                {formatDuration(goal.progressMinutes)} of {formatDuration(goal.targetMinutes)} this{" "}
                {goal.type === "daily" ? "day" : "week"}
              </p>
              <WaveformProgress percent={goal.progressPercent} />
              <div className="progress-summary">
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  {goal.progressPercent >= 100 ? "Goal reached! 🎉" : "Keep going"}
                </span>
                <span className="progress-percent">{goal.progressPercent}%</span>
              </div>
            </>
          ) : (
            <p className="loading-text">No goal set yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Goals;
