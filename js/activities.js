let tweet_array = [];

function topNKeysByCount(counts, n) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function mean(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function parseTweets(runkeeper_tweets) {
  if (!Array.isArray(runkeeper_tweets)) { alert('No tweets returned'); return; }
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // Count activities only from completed events with a known type
  const counts = {};
  tweet_array
    .filter(t => t.source === 'completed_event' && t.activityType && t.activityType !== 'unknown')
    .forEach(t => { counts[t.activityType] = (counts[t.activityType] || 0) + 1; });

  // # of distinct activities
  const activities = Object.keys(counts);
  document.getElementById('numberActivities').textContent = String(activities.length);

  // Top 3
  const top3 = topNKeysByCount(counts, 3);
  document.getElementById('firstMost').textContent  = top3[0] ?? '—';
  document.getElementById('secondMost').textContent = top3[1] ?? '—';
  document.getElementById('thirdMost').textContent  = top3[2] ?? '—';

  // Chart 1: counts
  const barData = activities.map(a => ({ activity: a, count: counts[a] }));
  const barSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Counts per activity (completed events)',
    data: { values: barData },
    mark: 'bar',
    encoding: {
      x: { field: 'activity', type: 'nominal', sort: '-y', title: 'Activity type', axis: { labelAngle: -45 } },
      y: { field: 'count', type: 'quantitative', title: 'Tweets' },
      tooltip: [{field:'activity', type:'nominal'}, {field:'count', type:'quantitative'}]
    }
  };
  vegaEmbed('#activityVis', barSpec, { actions: false });

  // Distances for top3, by day
  const weekdayOrder = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dow = d => weekdayOrder[new Date(d).getDay()];
  const distRows = tweet_array
    .filter(t => t.source === 'completed_event'
              && t.activityType && top3.includes(t.activityType)
              && Number.isFinite(t.distance) && t.distance > 0)
    .map(t => ({ activity: t.activityType, day: dow(t.time), distance: t.distance }));

  // Text summaries
  const byActivityDistances = {};
  for (const r of distRows) (byActivityDistances[r.activity] ||= []).push(r.distance);
  const activityMeans = Object.entries(byActivityDistances).map(([act, arr]) => [act, mean(arr)]);
  activityMeans.sort((a, b) => b[1] - a[1]);
  document.getElementById('longestActivityType').textContent  = activityMeans[0]?.[0] ?? '—';
  document.getElementById('shortestActivityType').textContent = activityMeans.at(-1)?.[0] ?? '—';

  // Weekend vs weekday
  const weekendSet = new Set(['Sat', 'Sun']);
  const weekendMean = mean(distRows.filter(r => weekendSet.has(r.day)).map(r => r.distance));
  const weekdayMean = mean(distRows.filter(r => !weekendSet.has(r.day)).map(r => r.distance));
  document.getElementById('weekdayOrWeekendLonger').textContent =
    (weekendMean || weekdayMean) ? (weekendMean > weekdayMean ? 'weekends' : 'weekdays') : '—';

  // Chart 2: raw distances by day
  const stripSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Distance by day for top activities',
    data: { values: distRows },
    mark: { type: 'circle', tooltip: true },
    encoding: {
      x: { field: 'day', type: 'ordinal', sort: weekdayOrder, title: 'Day of week' },
      y: { field: 'distance', type: 'quantitative', title: 'Distance (mi)' },
      color: { field: 'activity', type: 'nominal', title: 'Activity' }
    }
  };
  vegaEmbed('#distanceVis', stripSpec, { actions: false });

  // Chart 3: mean distance by day
  const meanSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Mean distance by day for top activities',
    data: { values: distRows },
    mark: 'line',
    encoding: {
      x: { field: 'day', type: 'ordinal', sort: weekdayOrder, title: 'Day of week' },
      y: { aggregate: 'mean', field: 'distance', type: 'quantitative', title: 'Mean distance (mi)' },
      color: { field: 'activity', type: 'nominal', title: 'Activity' }
    }
  };
  vegaEmbed('#distanceVisAggregated', meanSpec, { actions: false }).then(() => {
    const agg = document.getElementById('distanceVisAggregated');
    if (agg) agg.style.display = 'none'; // start with raw
  });

  // Toggle means/raw
  const btn = document.getElementById('aggregate');
  if (btn) {
    btn.addEventListener('click', () => {
      const raw = document.getElementById('distanceVis');
      const agg = document.getElementById('distanceVisAggregated');
      const showingMeans = agg && agg.style.display !== 'none';
      if (showingMeans) {
        if (agg) agg.style.display = 'none';
        if (raw) raw.style.display = '';
        btn.textContent = 'Show means';
      } else {
        if (raw) raw.style.display = 'none';
        if (agg) agg.style.display = '';
        btn.textContent = 'Show raw';
      }
    });
  }
}

// run after DOM
document.addEventListener('DOMContentLoaded', () => {
  const loader = (typeof getSavedTweets === 'function')
    ? getSavedTweets
    : (typeof loadSavedRunkeeperTweets === 'function')
      ? loadSavedRunkeeperTweets
      : null;
  if (!loader) { console.error('No loader found'); alert('Failed to load tweets.'); return; }
  loader().then(parseTweets).catch(e => { console.error(e); alert('Failed to load tweets.'); });
});
