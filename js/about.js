let tweet_array = [];

function setAllByClass(cls, value) {
  document.querySelectorAll(`.${cls}`).forEach(el => (el.textContent = String(value)));
}

function parseTweets(runkeeper_tweets) {
  if (!Array.isArray(runkeeper_tweets)) {
    console.error("No tweets returned or wrong format:", runkeeper_tweets);
    alert("No tweets returned");
    return;
  }

  // Build Tweet objects
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // Total & date range
  const total = tweet_array.length;
  const numberTweetsEl = document.getElementById("numberTweets");
  if (numberTweetsEl) numberTweetsEl.textContent = String(total);

  const dates = tweet_array.map(t => t.time).sort((a, b) => a - b);
  const fmt = d => d.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const firstDateEl = document.getElementById("firstDate");
  const lastDateEl  = document.getElementById("lastDate");
  if (firstDateEl && dates[0]) firstDateEl.textContent = fmt(dates[0]);
  if (lastDateEl  && dates.length) lastDateEl.textContent  = fmt(dates[dates.length - 1]);

  // Counts by source
  const by = { completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0 };
  tweet_array.forEach(t => (by[t.source] = (by[t.source] ?? 0) + 1));

  const pct = n => (total ? (100 * n / total).toFixed(2) : "0.00") + "%";

  setAllByClass("completedEvents",    by.completed_event);
  setAllByClass("completedEventsPct", pct(by.completed_event));

  setAllByClass("liveEvents",         by.live_event);
  setAllByClass("liveEventsPct",      pct(by.live_event));

  setAllByClass("achievements",       by.achievement);
  setAllByClass("achievementsPct",    pct(by.achievement));

  setAllByClass("miscellaneous",      by.miscellaneous);
  setAllByClass("miscellaneousPct",   pct(by.miscellaneous));

  // Of completed events, how many include user written text?
  const completed = tweet_array.filter(t => t.source === "completed_event");
  const completedWithText = completed.filter(t => t.written);
  setAllByClass("written",    completedWithText.length);
  setAllByClass("writtenPct", completed.length
    ? (100 * completedWithText.length / completed.length).toFixed(2) + "%"
    : "0.00%");
}

// Run after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const loader =
    (typeof getSavedTweets === "function") ? getSavedTweets :
    (typeof loadSavedRunkeeperTweets === "function") ? loadSavedRunkeeperTweets :
    null;

  if (!loader) {
    console.error("No tweet loader found (getSavedTweets / loadSavedRunkeeperTweets).");
    alert("Failed to load tweets.");
    return;
  }

  loader()
    .then(parseTweets)
    .catch(err => {
      console.error(err);
      alert("Failed to load tweets.");
    });
});
