import { useEffect, useState } from "react";
import { PRACTICE_TYPES, TAG_OPTIONS, MOOD_OPTIONS } from "../utils/sessionMeta";

const todayISO = () => new Date().toISOString().split("T")[0];

const emptyForm = {
  date: todayISO(),
  instrument: "",
  hours: "0",
  minutes: "30",
  notes: "",
  practiceType: "",
  tags: [],
  rating: 0,
  mood: "",
};

const SessionFormModal = ({ open, onClose, onSubmit, initialSession }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialSession) {
      const totalMinutes = initialSession.duration || 0;
      setForm({
        date: new Date(initialSession.date).toISOString().split("T")[0],
        instrument: initialSession.instrument || "",
        hours: String(Math.floor(totalMinutes / 60)),
        minutes: String(totalMinutes % 60),
        notes: initialSession.notes || "",
        practiceType: initialSession.practiceType || "",
        tags: initialSession.tags || [],
        rating: initialSession.rating || 0,
        mood: initialSession.mood || "",
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [initialSession, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const totalDuration = Number(form.hours || 0) * 60 + Number(form.minutes || 0);

    if (!form.instrument.trim()) {
      setError("Please enter an instrument.");
      return;
    }
    if (totalDuration <= 0) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date: form.date,
        instrument: form.instrument.trim(),
        duration: totalDuration,
        notes: form.notes.trim(),
        practiceType: form.practiceType,
        tags: form.tags,
        rating: Number(form.rating) || 0,
        mood: form.mood,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialSession ? "Edit practice session" : "Log a practice session"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                name="date"
                className="input"
                value={form.date}
                onChange={handleChange}
                max={todayISO()}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="instrument">Instrument</label>
              <input
                id="instrument"
                type="text"
                name="instrument"
                className="input"
                placeholder="e.g. Piano, Guitar, Violin"
                value={form.instrument}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Duration</label>
            <div className="form-row">
              <input
                type="number"
                name="hours"
                className="input"
                min="0"
                max="24"
                value={form.hours}
                onChange={handleChange}
                aria-label="Hours"
              />
              <input
                type="number"
                name="minutes"
                className="input"
                min="0"
                max="59"
                value={form.minutes}
                onChange={handleChange}
                aria-label="Minutes"
              />
            </div>
            <span className="hint">Hours and minutes practiced</span>
          </div>

          <div className="form-group">
            <label htmlFor="practiceType">Practice type</label>
            <select
              id="practiceType"
              name="practiceType"
              className="select"
              value={form.practiceType}
              onChange={handleChange}
            >
              <option value="">None</option>
              {PRACTICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tag-picker">
              {TAG_OPTIONS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-toggle ${form.tags.includes(tag) ? "selected" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rating</label>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className="star-btn"
                    onClick={() => setForm({ ...form, rating: form.rating === star ? 0 : star })}
                    aria-label={`Rate ${star} stars`}
                  >
                    {star <= form.rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="mood">Mood</label>
              <select id="mood" name="mood" className="select" value={form.mood} onChange={handleChange}>
                <option value="">None</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.emoji} {m.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Practice notes</label>
            <textarea
              id="notes"
              name="notes"
              className="textarea"
              placeholder="What did you work on? Any breakthroughs or struggles?"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="flex-between mt-16">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : initialSession ? "Save changes" : "Add session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionFormModal;
