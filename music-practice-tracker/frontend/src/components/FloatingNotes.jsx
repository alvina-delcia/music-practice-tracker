// Purely decorative floating music notes, rendered behind the app content.
// Positions/sizes are fixed (not random) so they don't jump around on re-render.
const NOTES = [
  { symbol: "♪", top: "6%", left: "3%", size: 34, color: "primary", duration: 16, delay: 0 },
  { symbol: "♫", top: "14%", left: "92%", size: 44, color: "accent", duration: 20, delay: 1 },
  { symbol: "♬", top: "38%", left: "97%", size: 28, color: "primary", duration: 14, delay: 2 },
  { symbol: "♩", top: "62%", left: "94%", size: 36, color: "accent", duration: 18, delay: 0.5 },
  { symbol: "♪", top: "82%", left: "90%", size: 26, color: "primary", duration: 15, delay: 1.5 },
  { symbol: "♫", top: "88%", left: "6%", size: 32, color: "accent", duration: 19, delay: 0.8 },
  { symbol: "♬", top: "70%", left: "2%", size: 24, color: "primary", duration: 13, delay: 2.2 },
  { symbol: "♩", top: "46%", left: "1%", size: 30, color: "accent", duration: 17, delay: 1.2 },
  { symbol: "♪", top: "24%", left: "50%", size: 26, color: "primary", duration: 21, delay: 0.3 },
  { symbol: "♫", top: "4%", left: "60%", size: 28, color: "accent", duration: 16, delay: 1.8 },
  { symbol: "♬", top: "18%", left: "24%", size: 24, color: "accent", duration: 15, delay: 0.6 },
  { symbol: "♩", top: "34%", left: "72%", size: 30, color: "primary", duration: 19, delay: 1.1 },
  { symbol: "♪", top: "52%", left: "38%", size: 22, color: "accent", duration: 14, delay: 2.4 },
  { symbol: "♫", top: "58%", left: "82%", size: 26, color: "primary", duration: 18, delay: 0.4 },
  { symbol: "♬", top: "76%", left: "58%", size: 30, color: "accent", duration: 16, delay: 1.6 },
  { symbol: "♩", top: "92%", left: "40%", size: 24, color: "primary", duration: 20, delay: 0.9 },
  { symbol: "♪", top: "8%", left: "38%", size: 20, color: "accent", duration: 17, delay: 2.1 },
  { symbol: "♫", top: "44%", left: "12%", size: 22, color: "primary", duration: 15, delay: 0.2 },
  { symbol: "♬", top: "66%", left: "30%", size: 20, color: "primary", duration: 19, delay: 1.4 },
  { symbol: "♩", top: "28%", left: "86%", size: 22, color: "accent", duration: 13, delay: 0.7 },
];

const FloatingNotes = () => {
  return (
    <div className="floating-notes" aria-hidden="true">
      {NOTES.map((n, i) => (
        <span
          key={i}
          className={`floating-note note-${n.color}`}
          style={{
            top: n.top,
            left: n.left,
            fontSize: n.size,
            animationDuration: `${n.duration}s`,
            animationDelay: `${n.delay}s`,
          }}
        >
          {n.symbol}
        </span>
      ))}
    </div>
  );
};

export default FloatingNotes;
