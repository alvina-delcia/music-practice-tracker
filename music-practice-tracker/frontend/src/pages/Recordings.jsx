import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import LiveWaveform from "../components/LiveWaveform";
import RecordingCard from "../components/RecordingCard";
import AudioPlayer from "../components/AudioPlayer";
import { TAG_OPTIONS } from "../utils/sessionMeta";
import { formatClockTime } from "../utils/audioFormat";

const RECORDER_STATE = { IDLE: "idle", RECORDING: "recording", PAUSED: "paused" };

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  const [recorderState, setRecorderState] = useState(RECORDER_STATE.IDLE);
  const [elapsed, setElapsed] = useState(0);
  const [pendingBlob, setPendingBlob] = useState(null);
  const [pendingWaveform, setPendingWaveform] = useState([]);
  const [micError, setMicError] = useState("");

  const [saveTitle, setSaveTitle] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [saveTags, setSaveTags] = useState([]);
  const [saveLinkedSession, setSaveLinkedSession] = useState("");
  const [saving, setSaving] = useState(false);

  const [compareIds, setCompareIds] = useState([]);

  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const [analyserNode, setAnalyserNode] = useState(null);
  const timerRef = useRef(null);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/recordings");
      setRecordings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data.slice(0, 30));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRecordings();
    loadSessions();
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecording = async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        setPendingBlob(blob);
        const waveform = await extractWaveform(blob);
        setPendingWaveform(waveform);
        setSaveTitle(`Recording - ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setElapsed(0);
      startTimer();
      setRecorderState(RECORDER_STATE.RECORDING);
    } catch (err) {
      console.error(err);
      setMicError("Couldn't access your microphone. Check your browser's permission settings and try again.");
    }
  };

  const pauseRecording = () => {
    mediaRecorderRef.current?.pause();
    stopTimer();
    setRecorderState(RECORDER_STATE.PAUSED);
  };

  const resumeRecording = () => {
    mediaRecorderRef.current?.resume();
    startTimer();
    setRecorderState(RECORDER_STATE.RECORDING);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    stopTimer();
    audioCtxRef.current?.close();
    setAnalyserNode(null);
    setRecorderState(RECORDER_STATE.IDLE);
  };

  // Decode the recorded blob and downsample to ~40 peak amplitude values for a thumbnail
  const extractWaveform = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const samples = 40;
      const blockSize = Math.floor(rawData.length / samples);
      const waveform = [];
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j] || 0);
        }
        waveform.push(sum / blockSize);
      }
      const max = Math.max(...waveform, 0.01);
      audioCtx.close();
      return waveform.map((v) => Math.min(1, v / max));
    } catch {
      return [];
    }
  };

  const discardPending = () => {
    setPendingBlob(null);
    setPendingWaveform([]);
    setSaveTitle("");
    setSaveNotes("");
    setSaveTags([]);
    setSaveLinkedSession("");
    setElapsed(0);
  };

  const toggleSaveTag = (tag) => {
    setSaveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSaveRecording = async () => {
    if (!pendingBlob || !saveTitle.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("audio", pendingBlob, "recording.webm");
      formData.append("title", saveTitle.trim());
      formData.append("duration", String(elapsed));
      formData.append("notes", saveNotes);
      formData.append("tags", JSON.stringify(saveTags));
      formData.append("waveform", JSON.stringify(pendingWaveform));
      if (saveLinkedSession) formData.append("linkedSession", saveLinkedSession);

      await api.post("/recordings", formData);
      discardPending();
      loadRecordings();
    } catch (err) {
      console.error(err);
      setMicError(err.response?.data?.message || "Failed to save the recording. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (id, title) => {
    await api.put(`/recordings/${id}`, { title });
    loadRecordings();
  };

  const handleUpdateNotes = async (id, payload) => {
    await api.put(`/recordings/${id}`, payload);
    loadRecordings();
  };

  const handleDelete = async (recording) => {
    if (!window.confirm(`Delete "${recording.title}"? This can't be undone.`)) return;
    await api.delete(`/recordings/${recording._id}`);
    setCompareIds((prev) => prev.filter((id) => id !== recording._id));
    loadRecordings();
  };

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareRecordings = compareIds.map((id) => recordings.find((r) => r._id === id)).filter(Boolean);
  const pendingUrl = pendingBlob ? URL.createObjectURL(pendingBlob) : null;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <span className="eyebrow">Studio</span>
          <h1>Recordings</h1>
          <p className="subtitle">Capture your sound, listen back, and hear yourself improve.</p>
        </div>
      </div>

      <div className="recorder-panel">
        {micError && <div className="error-banner">{micError}</div>}

        {!pendingBlob ? (
          <>
            <LiveWaveform analyser={analyserNode} active={recorderState === RECORDER_STATE.RECORDING} />

            <div className="recorder-timer">{formatClockTime(elapsed)}</div>

            <div className="recorder-controls">
              {recorderState === RECORDER_STATE.IDLE && (
                <button className="record-btn idle" onClick={startRecording} aria-label="Start recording">
                  <span className="record-btn-dot" />
                </button>
              )}
              {recorderState === RECORDER_STATE.RECORDING && (
                <>
                  <button className="record-btn recording" onClick={stopRecording} aria-label="Stop recording">
                    <span className="record-btn-square" />
                  </button>
                  <button className="btn btn-ghost" onClick={pauseRecording}>
                    Pause
                  </button>
                </>
              )}
              {recorderState === RECORDER_STATE.PAUSED && (
                <>
                  <button className="record-btn recording" onClick={stopRecording} aria-label="Stop recording">
                    <span className="record-btn-square" />
                  </button>
                  <button className="btn btn-primary" onClick={resumeRecording}>
                    Resume
                  </button>
                </>
              )}
            </div>

            <p className="recorder-hint">
              {recorderState === RECORDER_STATE.IDLE && "Tap the button to start recording"}
              {recorderState === RECORDER_STATE.RECORDING && "Recording... tap the square to stop"}
              {recorderState === RECORDER_STATE.PAUSED && "Paused — resume or stop to save"}
            </p>
          </>
        ) : (
          <div className="save-recording-panel">
            <div className="eyebrow">Review & save</div>
            <AudioPlayer src={pendingUrl} duration={elapsed} waveform={pendingWaveform} />

            <div className="form-group mt-16">
              <label>Title</label>
              <input className="input" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tag-picker">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    className={`tag-toggle ${saveTags.includes(tag) ? "selected" : ""}`}
                    onClick={() => toggleSaveTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Link to a practice session (optional)</label>
              <select className="select" value={saveLinkedSession} onChange={(e) => setSaveLinkedSession(e.target.value)}>
                <option value="">None</option>
                {sessions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.instrument} — {new Date(s.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                className="textarea"
                placeholder="What did you notice while listening back?"
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
              />
            </div>

            <div className="flex-between">
              <button className="btn btn-ghost" onClick={discardPending}>
                Discard
              </button>
              <button className="btn btn-primary" onClick={handleSaveRecording} disabled={saving || !saveTitle.trim()}>
                {saving ? "Saving..." : "Save recording"}
              </button>
            </div>
          </div>
        )}
      </div>

      {compareRecordings.length === 2 && (
        <div className="compare-panel">
          <div className="flex-between mb-16">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Comparing 2 recordings
            </span>
            <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12.5 }} onClick={() => setCompareIds([])}>
              Clear
            </button>
          </div>
          <div className="compare-grid">
            {compareRecordings.map((r) => (
              <div key={r._id} className="compare-item">
                <div className="recording-title" style={{ cursor: "default" }}>
                  {r.title}
                </div>
                <div className="recording-meta">{new Date(r.date).toLocaleDateString()}</div>
                <AudioPlayer src={`${(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "")}/uploads/${r.filename}`} duration={r.duration} waveform={r.waveform} />
              </div>
            ))}
          </div>
          <p className="recorder-hint">Playing one automatically pauses the other, so you can toggle back and forth.</p>
        </div>
      )}

      <div className="mt-24">
        <span className="eyebrow">Library</span>
        <h3 style={{ marginBottom: 16 }}>Your recordings</h3>

        {loading ? (
          <p className="loading-text">Loading your recordings...</p>
        ) : recordings.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">🎙️</div>
            <h3>No recordings yet</h3>
            <p>Record your first take above to start building your library.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recordings.map((r) => (
              <RecordingCard
                key={r._id}
                recording={r}
                onRename={handleRename}
                onDelete={handleDelete}
                onUpdateNotes={handleUpdateNotes}
                compareSelected={compareIds.includes(r._id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Recordings;
