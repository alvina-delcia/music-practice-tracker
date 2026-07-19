// Assigns each distinct instrument a consistent color from the app's palette,
// so the same instrument always gets the same accent color across the app.
const PALETTE = [
  "#7a63c9", // primary violet
  "#f0954e", // accent orange
  "#4f9d82", // success sage
  "#cf6a6a", // soft red
  "#5b8fc9", // soft blue
  "#c98fc9", // soft magenta
];

export const getInstrumentColor = (instrument = "") => {
  let hash = 0;
  for (let i = 0; i < instrument.length; i++) {
    hash = instrument.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};
