import { useEffect, useRef, useState } from "react";
import { formatClockTime } from "../utils/audioFormat";
import WaveformThumbnail from "./WaveformThumbnail";

const SPEEDS = [0.5, 1, 1.5];

// registry so only one AudioPlayer plays at a time across the page
let currentlyPlayingRef = null;

const AudioPlayer = ({ src, duration, waveform = [] }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // pause whatever else is currently playing on the page
      if (currentlyPlayingRef && currentlyPlayingRef !== audio) {
        currentlyPlayingRef.pause();
      }
      currentlyPlayingRef = audio;
      audio.play();
      setPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const changeSpeed = (rate) => {
    setSpeed(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const total = duration || audioRef.current?.duration || 0;
  const progress = total > 0 ? currentTime / total : 0;

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button className="play-toggle-btn" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>

      <div className="audio-player-main">
        {waveform.length > 0 ? (
          <div style={{ position: "relative" }}>
            <WaveformThumbnail samples={waveform} progress={progress} />
            <input
              type="range"
              min="0"
              max={total || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="seek-overlay"
            />
          </div>
        ) : (
          <input
            type="range"
            min="0"
            max={total || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="seek-bar"
          />
        )}
        <div className="audio-player-meta">
          <span>
            {formatClockTime(currentTime)} / {formatClockTime(total)}
          </span>
          <div className="speed-toggle-group">
            {SPEEDS.map((r) => (
              <button
                key={r}
                className={`speed-btn ${speed === r ? "active" : ""}`}
                onClick={() => changeSpeed(r)}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
