// Renders a compact bar-style waveform preview from an array of 0-1 amplitude samples.
const WaveformThumbnail = ({ samples = [], progress = 0 }) => {
  if (!samples.length) {
    return <div className="waveform-thumb-empty" />;
  }

  return (
    <div className="waveform-thumb">
      {samples.map((s, i) => {
        const played = samples.length > 0 && i / samples.length < progress;
        return (
          <span
            key={i}
            className={`waveform-thumb-bar ${played ? "played" : ""}`}
            style={{ height: `${Math.max(12, s * 100)}%` }}
          />
        );
      })}
    </div>
  );
};

export default WaveformThumbnail;
