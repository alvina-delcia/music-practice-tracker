import { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import { TAG_OPTIONS } from "../utils/sessionMeta";
import { getInstrumentIcon } from "../utils/instrumentIcons";
import { API_ORIGIN } from "../utils/audioFormat";

const RecordingCard = ({ recording, onRename, onDelete, onUpdateNotes, compareSelected, onToggleCompare }) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(recording.title);
  const [expanded, setExpanded] = useState(false);
  const [notesDraft, setNotesDraft] = useState(recording.notes || "");
  const [tagsDraft, setTagsDraft] = useState(recording.tags || []);

  const saveTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== recording.title) {
      onRename(recording._id, titleDraft.trim());
    } else {
      setTitleDraft(recording.title);
    }
  };

  const toggleTag = (tag) => {
    setTagsDraft((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const saveNotesAndTags = () => {
    onUpdateNotes(recording._id, { notes: notesDraft, tags: tagsDraft });
  };

  return (
    <div className="recording-card card hoverable">
      <div className="recording-card-top">
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              className="input"
              style={{ fontSize: 15, fontWeight: 700, padding: "6px 10px" }}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              autoFocus
            />
          ) : (
            <h3
              className="recording-title"
              onClick={() => setEditingTitle(true)}
              title="Click to rename"
            >
              {recording.title}
            </h3>
          )}
          <div className="recording-meta">
            {new Date(recording.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            {recording.linkedSession && (
              <span className="linked-session-badge">
                {getInstrumentIcon(recording.linkedSession.instrument)} {recording.linkedSession.instrument}
              </span>
            )}
          </div>
        </div>

        <label className="compare-checkbox" title="Select to compare">
          <input type="checkbox" checked={compareSelected} onChange={() => onToggleCompare(recording._id)} />
          Compare
        </label>
      </div>

      <AudioPlayer
        src={`${API_ORIGIN}/uploads/${recording.filename}`}
        duration={recording.duration}
        waveform={recording.waveform}
      />

      {recording.tags?.length > 0 && !expanded && (
        <div className="feed-tags mt-8">
          {recording.tags.map((t) => (
            <span key={t} className="tag-pill">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="recording-card-actions">
        <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12.5 }} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Hide notes" : "Notes & tags"}
        </button>
        <button className="icon-btn danger" onClick={() => onDelete(recording)} aria-label="Delete recording" title="Delete">
          🗑
        </button>
      </div>

      {expanded && (
        <div className="feed-expanded">
          <div className="tag-picker">
            {TAG_OPTIONS.map((tag) => (
              <button
                type="button"
                key={tag}
                className={`tag-toggle ${tagsDraft.includes(tag) ? "selected" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <textarea
            className="textarea"
            placeholder="What did you notice? e.g. intonation was off here..."
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
          />
          <button className="btn btn-primary" style={{ alignSelf: "flex-end", padding: "8px 18px", fontSize: 13 }} onClick={saveNotesAndTags}>
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default RecordingCard;
