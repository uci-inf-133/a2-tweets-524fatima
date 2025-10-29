let tweet_array = [];

function topNKeysByCount(counts, n) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function mean(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets) { alert('No tweets returned'); return; }
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // --- Count activities only from completed events
  const counts = {};
  tweet_array
    .filter(t => t.source === 'completed_event' && t.activityType)
    .forEach(t => { counts[t.activityType] = (counts[t.activityType] || 0) + 1; });

  // #numberActivities
  document.getElementById('numberActivities').textContent = String(Object.keys(counts).length);

  // Top 3 activities
  const top3 = topNKeysByCount(counts, 3);
  document.getElementById('firstMost').textContent  = top3[0] ?? '—';
  document.getElementById('secondMost').textContent = top3[1] ?? '—';
  document.getElementById('thirdMost').textContent  = top3[2] ?? '—';

  // --- Chart 1: bar counts per activity
  const barData = Object.entries(counts).map(([activity, count]) => ({ activity, count }));
  const barSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Counts per activity (completed events)',
    data: { values: barData },
    mark: 'bar',
    encoding: {
      x: { field: 'activity', type: 'nominal', sort: '-y', title: 'Activity type' },
      y: { field: 'count', type: 'quantitative', title: 'Tweets' }
    }
  };
  vegaEmbed('#activityVis', barSpec, { actions: false });

  // Build distances rows for top 3 activities
  const weekdayOrder = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dow = d => weekdayOrder[new Date(d).getDay()];

  const distRows = tweet_array
    .filter(t => t.source === 'completed_event'
              && t.activityType
              && top3.includes(t.activityType)
              && Number.isFinite(t.distance))
    .map(t => ({
      activity: t.activityType,
      day: dow(t.time),
      distance: t.distance
    }));

  // --- Text: longest/shortest by activity (overall)
  const byActivityDistances = {};
  for (const row of distRows) {
    (byActivityDistances[row.activity] ||= []).push(row.distance);
  }
  const activityMeans = Object.entries(byActivityDistances).map(([act, arr]) => [act, mean(arr)]);
  activityMeans.sort((a, b) => b[1] - a[1]); // high → low

  const longest = activityMeans[0]?.[0] ?? '—';
  const shortest = activityMeans.at(-1)?.[0] ?? '—';
  document.getElementById('longestActivityType').textContent  = longest;
  document.getElementById('shortestActivityType').textContent = shortest;

  // --- Text: weekend vs weekday longer
  const weekendSet = new Set(['Sat', 'Sun']);
  const weekendDistances = distRows.filter(r => weekendSet.has(r.day)).map(r => r.distance);
  const weekdayDistances = distRows.filter(r => !weekendSet.has(r.day)).map(r => r.distance);

  const weekendMean = mean(weekendDistances);
  const weekdayMean = mean(weekdayDistances);
  document.getElementById('weekdayOrWeekendLonger').textContent =
    weekendMean > weekdayMean ? 'weekends' : 'weekdays';

  // --- Chart 2: raw distances (strip/scatter) by day for top 3
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

  // --- Chart 3: mean distance by day for top 3
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
  vegaEmbed('#distanceVisAggregated', meanSpec, { actions: false })
    .then(() => {
      // hide aggregated initially
      const agg = document.getElementById('distanceVisAggregated');
      agg.style.display = 'none';
    });

  // Toggle button: Show means / Show raw
  const btn = document.getElementById('aggregate');
  btn.addEventListener('click', () => {
    const raw = document.getElementById('distanceVis');
    const agg = document.getElementById('distanceVisAggregated');
    const showingMeans = agg.style.display !== 'none';
    if (showingMeans) {
      agg.style.display = 'none';
      raw.style.display = '';
      btn.textContent = 'Show means';
    } else {
      raw.style.display = 'none';
      agg.style.display = '';
      btn.textContent = 'Show raw';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedRunkeeperTweets().then(parseTweets);
});
