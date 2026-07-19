import { useState } from "react";
import { formatDuration } from "./SessionCard";
import { getInstrumentIcon } from "../utils/instrumentIcons";
import { getInstrumentColor } from "../utils/instrumentColors";
import { MOOD_OPTIONS } from "../utils/sessionMeta";

const SessionFeedCard = ({ session, insight, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const color = getInstrumentColor(session.instrument);
  const moodEntry = MOOD_OPTIONS.find((m) => m.value === session.mood);

  return (
    <div className="feed-item">
      <span className="feed-dot" style={{ boxShadow: `0 0 0 2px ${color}` }} />
      <div
        className="feed-card"
        style={{ "--instrument-color": color }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="feed-card-top">
          <div className="feed-card-title-row">
            <div className="feed-instrument-icon" style={{ "--instrument-color": color }}>
              {getInstrumentIcon(session.instrument)}
            </div>
            <div>
              <div className="feed-instrument-name">{session.instrument}</div>
              {session.practiceType && <div className="feed-practice-type">{session.practiceType}</div>}
            </div>
          </div>
          <span className="duration-pill">{formatDuration(session.duration)}</span>
        </div>

        {!expanded && session.notes && <div className="feed-notes-preview">{session.notes}</div>}

        {session.tags?.length > 0 && (
          <div className="feed-tags">
            {session.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        )}

        {insight && <div className="feed-insight">✨ {insight}</div>}

        {expanded && (
          <div className="feed-expanded" onClick={(e) => e.stopPropagation()}>
            <div className="feed-expanded-row">
              <span className="feed-expanded-label">Date</span>
              <span>
                {new Date(session.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {session.rating > 0 && (
              <div className="feed-expanded-row">
                <span className="feed-expanded-label">Rating</span>
                <span className="feed-star-display">{"★".repeat(session.rating)}{"☆".repeat(5 - session.rating)}</span>
              </div>
            )}

            {moodEntry && (
              <div className="feed-expanded-row">
                <span className="feed-expanded-label">Mood</span>
                <span>
                  {moodEntry.emoji} {moodEntry.value}
                </span>
              </div>
            )}

            {session.notes && (
              <div>
                <div className="feed-expanded-label mb-16" style={{ marginBottom: 6 }}>
                  Notes
                </div>
                <p style={{ fontSize: 13.5, color: "var(--color-text)", lineHeight: 1.5 }}>{session.notes}</p>
              </div>
            )}

            <div className="feed-card-actions">
              {onEdit && (
                <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => onEdit(session)}>
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  className="btn btn-danger-ghost"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                  onClick={() => onDelete(session)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionFeedCard;
