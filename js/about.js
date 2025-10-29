// js/about.js
let tweet_array = [];

function setAllByClass(cls, value) {
  document.querySelectorAll(`.${cls}`).forEach(el => (el.textContent = String(value)));
}

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets || !Array.isArray(runkeeper_tweets)) {
    console.error("No tweets returned or wrong format:", runkeeper_tweets);
    alert("No tweets returned");
    return;
  }

  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // Total & dates
  const total = tweet_array.length;
  document.getElementById("numberTweets").textContent = String(total);

  const dates = tweet_array.map(t => t.time).sort((a, b) => a - b);
  const fmt = d => d.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  document.getElementById("firstDate").textContent = fmt(dates[0]);
  document.getElementById("lastDate").textContent  = fmt(dates[dates.length - 1]);

  // Counts by source (must match Tweet.source)
  const by = { completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0 };
  tweet_array.forEach(t => (by[t.source] = (by[t.source] ?? 0) + 1));

  const pct = n => (100 * n / total).toFixed(2) + "%";

  setAllByClass("completedEvents", by.completed_event);
  setAllByClass("completedEventsPct", pct(by.completed_event));

  setAllByClass("liveEvents", by.live_event);
  setAllByClass("liveEventsPct", pct(by.live_event));

  setAllByClass("achievements", by.achievement);
  setAllByClass("achievementsPct", pct(by.achievement));

  setAllByClass("miscellaneous", by.miscellaneous);
  setAllByClass("miscellaneousPct", pct(by.miscellaneous));

  const completed = tweet_array.filter(t => t.source === "completed_event");
  const completedWithText = completed.filter(t => t.written);
  setAllByClass("written", completedWithText.length);
  setAllByClass("writtenPct", completed.length ? pct(completedWithText.length) : "0.00%");
}

// Run after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  loadTweets()
    .then(parseTweets)
    .catch(err => {
      console.error(err);
      alert("Failed to load tweets.");
    });
});
