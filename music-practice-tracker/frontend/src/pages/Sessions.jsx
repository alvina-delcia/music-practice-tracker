import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import SessionFeedCard from "../components/SessionFeedCard";
import SessionFormModal from "../components/SessionFormModal";
import { TAG_OPTIONS } from "../utils/sessionMeta";
import { computeSessionInsights } from "../utils/sessionInsights";

const emptyFilters = {
  search: "",
  instrument: "",
  tag: "",
  minDuration: "",
  maxDuration: "",
  fromDate: "",
  toDate: "",
};

const isSameDay = (a, b) => a.toDateString() === b.toDateString();

const MICROCOPY = {
  Today: "Nice consistency 🎶",
  Yesterday: "Back at it again!",
  "This Week": "Building the habit, one session at a time.",
  Older: "Where it all began.",
};

const Sessions = () => {
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sessions");
      setAllSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const instrumentOptions = useMemo(
    () => [...new Set(allSessions.map((s) => s.instrument))].sort(),
    [allSessions]
  );

  const filteredSessions = useMemo(() => {
    return allSessions.filter((s) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inNotes = s.notes?.toLowerCase().includes(q);
        const inInstrument = s.instrument?.toLowerCase().includes(q);
        if (!inNotes && !inInstrument) return false;
      }
      if (filters.instrument && s.instrument !== filters.instrument) return false;
      if (filters.tag && !(s.tags || []).includes(filters.tag)) return false;
      if (filters.minDuration && s.duration < Number(filters.minDuration)) return false;
      if (filters.maxDuration && s.duration > Number(filters.maxDuration)) return false;
      if (filters.fromDate && new Date(s.date) < new Date(filters.fromDate)) return false;
      if (filters.toDate && new Date(s.date) > new Date(filters.toDate + "T23:59:59")) return false;
      return true;
    });
  }, [allSessions, filters]);

  const insights = useMemo(() => computeSessionInsights(filteredSessions), [filteredSessions]);

  const groups = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const buckets = { Today: [], Yesterday: [], "This Week": [], Older: [] };

    [...filteredSessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((s) => {
        const d = new Date(s.date);
        if (isSameDay(d, today)) buckets.Today.push(s);
        else if (isSameDay(d, yesterday)) buckets.Yesterday.push(s);
        else if (d >= weekAgo) buckets["This Week"].push(s);
        else buckets.Older.push(s);
      });

    return buckets;
  }, [filteredSessions]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.search) chips.push({ key: "search", label: `"${filters.search}"` });
    if (filters.instrument) chips.push({ key: "instrument", label: filters.instrument });
    if (filters.tag) chips.push({ key: "tag", label: filters.tag });
    if (filters.minDuration) chips.push({ key: "minDuration", label: `Min ${filters.minDuration}m` });
    if (filters.maxDuration) chips.push({ key: "maxDuration", label: `Max ${filters.maxDuration}m` });
    if (filters.fromDate) chips.push({ key: "fromDate", label: `From ${filters.fromDate}` });
    if (filters.toDate) chips.push({ key: "toDate", label: `To ${filters.toDate}` });
    return chips;
  }, [filters]);

  const removeFilter = (key) => setFilters((prev) => ({ ...prev, [key]: "" }));

  const handleAddOrEdit = async (payload) => {
    if (editingSession) {
      await api.put(`/sessions/${editingSession._id}`, payload);
    } else {
      await api.post("/sessions", payload);
    }
    setModalOpen(false);
    setEditingSession(null);
    loadSessions();
  };

  const openEdit = (session) => {
    setEditingSession(session);
    setModalOpen(true);
  };

  const openAdd = () => {
    setEditingSession(null);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/sessions/${deleteTarget._id}`);
    setDeleteTarget(null);
    loadSessions();
  };

  const hasAnySessions = allSessions.length > 0;
  const hasVisibleSessions = filteredSessions.length > 0;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Practice history</span>
          <h1>Your practice journey</h1>
          <p className="subtitle">Explore every session — a timeline of your musical growth.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add session
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input
              type="text"
              className="input"
              placeholder="Instrument or notes..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Instrument</label>
            <select
              className="select"
              value={filters.instrument}
              onChange={(e) => setFilters({ ...filters, instrument: e.target.value })}
            >
              <option value="">All instruments</option>
              {instrumentOptions.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tag</label>
            <select
              className="select"
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            >
              <option value="">All tags</option>
              {TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Duration (min)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                className="input"
                placeholder="Min"
                min="0"
                value={filters.minDuration}
                onChange={(e) => setFilters({ ...filters, minDuration: e.target.value })}
              />
              <input
                type="number"
                className="input"
                placeholder="Max"
                min="0"
                value={filters.maxDuration}
                onChange={(e) => setFilters({ ...filters, maxDuration: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>From date</label>
            <input
              type="date"
              className="input"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>To date</label>
            <input
              type="date"
              className="input"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="filter-chips">
            {activeFilterChips.map((chip) => (
              <span className="filter-chip" key={chip.key}>
                {chip.label}
                <button onClick={() => removeFilter(chip.key)} aria-label={`Remove ${chip.label} filter`}>
                  ✕
                </button>
              </span>
            ))}
            <button className="btn btn-ghost" style={{ padding: "5px 14px", fontSize: 12 }} onClick={() => setFilters(emptyFilters)}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="loading-text">Loading your practice history...</p>
      ) : !hasAnySessions ? (
        <div className="card empty-state">
          <div className="empty-state-icon">♪</div>
          <h3>Your story starts here</h3>
          <p>Log your first practice session to begin your timeline.</p>
        </div>
      ) : !hasVisibleSessions ? (
        <div className="card empty-state">
          <div className="empty-state-icon">♪</div>
          <h3>No sessions match these filters</h3>
          <p>Try clearing a filter or two.</p>
        </div>
      ) : (
        Object.entries(groups).map(([groupName, sessions], idx) => {
          if (sessions.length === 0) return null;
          return (
            <div key={groupName}>
              {idx > 0 && <div className="feed-divider">♪</div>}
              <div className="feed-section">
                <div className="feed-section-header">
                  <span className="feed-section-title">{groupName}</span>
                  <span className="feed-section-micro">{MICROCOPY[groupName]}</span>
                </div>
                <div className="feed-timeline">
                  {sessions.map((session) => (
                    <SessionFeedCard
                      key={session._id}
                      session={session}
                      insight={insights.get(session._id)}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}

      <SessionFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSession(null);
        }}
        onSubmit={handleAddOrEdit}
        initialSession={editingSession}
      />

      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 10 }}>Delete this session?</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 24 }}>
              This will permanently remove the {deleteTarget.instrument} session from{" "}
              {new Date(deleteTarget.date).toLocaleDateString()}. This can't be undone.
            </p>
            <div className="flex-between">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger-ghost" onClick={confirmDelete}>
                Delete session
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Sessions;
