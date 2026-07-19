// Maps common instrument names to an emoji icon for a bit of visual personality.
// Falls back to a generic music note for anything not in the list.
const ICON_MAP = {
  piano: "🎹",
  keyboard: "🎹",
  guitar: "🎸",
  "electric guitar": "🎸",
  "bass guitar": "🎸",
  bass: "🎸",
  violin: "🎻",
  viola: "🎻",
  cello: "🎻",
  drums: "🥁",
  percussion: "🥁",
  flute: "🪈",
  clarinet: "🎶",
  saxophone: "🎷",
  sax: "🎷",
  trumpet: "🎺",
  trombone: "🎺",
  voice: "🎤",
  vocals: "🎤",
  singing: "🎤",
  ukulele: "🎸",
  harp: "🎼",
};

export const getInstrumentIcon = (instrument = "") => {
  const key = instrument.trim().toLowerCase();
  return ICON_MAP[key] || "🎵";
};
