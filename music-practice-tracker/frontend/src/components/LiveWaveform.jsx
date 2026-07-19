import { useEffect, useRef } from "react";

// Draws a live, animated waveform from an AnalyserNode while `active` is true.
const LiveWaveform = ({ analyser, active }) => {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    if (!active || !analyser) {
      ctx.clearRect(0, 0, width, height);
      // Draw a flat idle line
      ctx.strokeStyle = "rgba(122, 99, 201, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const step = Math.floor(bufferLength / barCount);
      const barWidth = width / barCount;
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#7a63c9");
      gradient.addColorStop(1, "#f0954e");

      for (let i = 0; i < barCount; i++) {
        const sample = dataArray[i * step] / 128 - 1; // -1..1
        const barHeight = Math.max(4, Math.abs(sample) * height * 0.9);
        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x + 1, y, barWidth - 2, barHeight, 3);
        } else {
          ctx.rect(x + 1, y, barWidth - 2, barHeight);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className="live-waveform-canvas" />;
};

export default LiveWaveform;
