// Computes a small set of per-session contextual insights — things like
// "your longest violin session this week" — rather than global dashboard stats.
// Returns a Map from session._id -> insight string (only for sessions worth flagging).
export const computeSessionInsights = (sessions) => {
  const insights = new Map();
  if (!sessions.length) return insights;

  const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - mondayOffset);

  // 1) Longest session this week, per instrument
  const thisWeekByInstrument = {};
  sorted.forEach((s) => {
    const d = new Date(s.date);
    if (d >= monday) {
      if (!thisWeekByInstrument[s.instrument] || s.duration > thisWeekByInstrument[s.instrument].duration) {
        thisWeekByInstrument[s.instrument] = s;
      }
    }
  });
  Object.values(thisWeekByInstrument).forEach((s) => {
    insights.set(s._id, `Your longest ${s.instrument} session this week 🎉`);
  });

  // 2) First time practicing an instrument in N+ days (only flag gaps of 5+ days)
  const lastSeenByInstrument = {};
  sorted.forEach((s) => {
    if (insights.has(s._id)) {
      lastSeenByInstrument[s.instrument] = new Date(s.date);
      return;
    }
    const last = lastSeenByInstrument[s.instrument];
    if (last) {
      const gapDays = Math.round((new Date(s.date) - last) / (1000 * 60 * 60 * 24));
      if (gapDays >= 5) {
        insights.set(s._id, `First time practicing ${s.instrument} in ${gapDays} days!`);
      }
    }
    lastSeenByInstrument[s.instrument] = new Date(s.date);
  });

  // 3) Weekday pattern — flag sessions on the weekday with the clearly highest average duration
  const weekdayTotals = Array(7).fill(0);
  const weekdayCounts = Array(7).fill(0);
  sorted.forEach((s) => {
    const wd = new Date(s.date).getDay();
    weekdayTotals[wd] += s.duration;
    weekdayCounts[wd] += 1;
  });
  const weekdayAverages = weekdayTotals.map((total, i) => (weekdayCounts[i] ? total / weekdayCounts[i] : 0));
  const overallAverage = weekdayAverages.reduce((a, b) => a + b, 0) / 7;
  const bestWeekday = weekdayAverages.indexOf(Math.max(...weekdayAverages));
  const weekdayNames = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

  if (
    weekdayCounts[bestWeekday] >= 2 &&
    overallAverage > 0 &&
    weekdayAverages[bestWeekday] > overallAverage * 1.25
  ) {
    // Flag the single most recent session on that weekday that doesn't already have an insight
    const candidate = [...sorted]
      .reverse()
      .find((s) => new Date(s.date).getDay() === bestWeekday && !insights.has(s._id));
    if (candidate) {
      insights.set(candidate._id, `You usually practice longer on ${weekdayNames[bestWeekday]} 📈`);
    }
  }

  return insights;
};
