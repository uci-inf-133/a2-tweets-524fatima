let tweet_array = [];

function setAllByClass(cls, value) {
  // updates ALL spans with the same class (e.g., completedEvents appears twice)
  document.querySelectorAll(`.${cls}`).forEach(el => el.textContent = value);
}

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets) {
    window.alert('No tweets returned');
    return;
  }

  // Tweet class comes from js/tweet.js (compiled from ts/tweet.ts)
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // Total tweets
  document.getElementById('numberTweets').textContent = String(tweet_array.length);

  // Earliest / latest dates
  const dates = tweet_array.map(t => t.time).sort((a, b) => a - b);
  const fmt = d => d.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('firstDate').textContent = fmt(dates[0]);
  document.getElementById('lastDate').textContent  = fmt(dates[dates.length - 1]);

  // Category counts (relies on Tweet.source: 'completed' | 'live' | 'achievement' | 'misc')
  const total = tweet_array.length;
  const byCat = { completed: 0, live: 0, achievement: 0, misc: 0 };

  tweet_array.forEach(t => byCat[t.source]++);

  const pct = n => (100 * n / total).toFixed(2) + '%';

  setAllByClass('completedEvents', byCat.completed);
  setAllByClass('completedEventsPct', (100 * byCat.completed / total).toFixed(2) + '%');

  setAllByClass('liveEvents', byCat.live);
  setAllByClass('liveEventsPct', (100 * byCat.live / total).toFixed(2) + '%');

  setAllByClass('achievements', byCat.achievement);
  setAllByClass('achievementsPct', (100 * byCat.achievement / total).toFixed(2) + '%');

  setAllByClass('miscellaneous', byCat.misc);
  setAllByClass('miscellaneousPct', (100 * byCat.misc / total).toFixed(2) + '%');

  // Of the completed tweets, how many contain user-written text?
  // relies on Tweet.written (boolean)
  const completed = tweet_array.filter(t => t.source === 'completed');
  const completedWithText = completed.filter(t => t.written);
  setAllByClass('written', completedWithText.length);
  setAllByClass('writtenPct',
    completed.length ? (100 * completedWithText.length / completed.length).toFixed(2) + '%' : '0.00%');
}

// Wait for DOM, then load data and parse
document.addEventListener('DOMContentLoaded', () => {
  loadSavedRunkeeperTweets().then(parseTweets);
});
