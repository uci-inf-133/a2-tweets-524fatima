// js/about.js
let tweet_array = [];

function setAllByClass(cls, value) {
  document.querySelectorAll(`.${cls}`).forEach(el => el.textContent = value);
}

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets) { alert('No tweets returned'); return; }

  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // totals & dates
  const total = tweet_array.length;
  document.getElementById('numberTweets').textContent = String(total);

  const dates = tweet_array.map(t => t.time).sort((a,b) => a.getTime()-b.getTime());
  const fmt = d => d.toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('firstDate').textContent = fmt(dates[0]);
  document.getElementById('lastDate').textContent  = fmt(dates[dates.length-1]);

  // counts by source
  const by = { completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0 };
  tweet_array.forEach(t => by[t.source] = (by[t.source] ?? 0) + 1);

  const pct = n => (100 * n / total).toFixed(2) + '%';

  setAllByClass('completedEvents', by.completed_event);
  setAllByClass('completedEventsPct', pct(by.completed_event));

  setAllByClass('liveEvents', by.live_event);
  setAllByClass('liveEventsPct', pct(by.live_event));

  setAllByClass('achievements', by.achievement);
  setAllByClass('achievementsPct', pct(by.achievement));

  setAllByClass('miscellaneous', by.miscellaneous);
  setAllByClass('miscellaneousPct', pct(by.miscellaneous));

  // written text among completed events
  const completed = tweet_array.filter(t => t.source === 'completed_event');
  const completedWithText = completed.filter(t => t.written);
  setAllByClass('written', completedWithText.length);
  setAllByClass('writtenPct', completed.length ? pct(completedWithText.length) : '0.00%');
}

// call it after loading tweets
getSavedTweets().then(parseTweets);  // or loadSavedRunkeeperTweets().then(parseTweets)
