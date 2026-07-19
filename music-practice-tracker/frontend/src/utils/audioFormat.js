// The backend origin (without the trailing /api) — used to build URLs for uploaded audio files.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export const formatClockTime = (totalSeconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
