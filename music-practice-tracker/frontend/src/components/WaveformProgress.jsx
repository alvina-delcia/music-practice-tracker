// A progress indicator styled like an audio waveform / equalizer,
// used to visualize goal progress in a way that fits the music theme.
const BAR_COUNT = 24;

// Deterministic pseudo-random heights so the waveform looks organic
// but doesn't reshuffle on every re-render.
const HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const wave = Math.sin(i * 0.7) * 0.5 + Math.sin(i * 1.9) * 0.3;
  return 30 + Math.abs(wave) * 70;
});

const WaveformProgress = ({ percent = 0 }) => {
  const filledCount = Math.round((percent / 100) * BAR_COUNT);

  return (
    <div className="waveform-progress" role="img" aria-label={`${percent}% of goal completed`}>
      {HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={`waveform-bar ${i < filledCount ? "filled" : ""}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};

export default WaveformProgress;
