let tweet_array = [];

function topNKeysByCount(counts, n) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets) { alert('No tweets returned'); return; }
  tweet_array = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));

  // --- Chart 1: how many of each activity type (completed only)
  const counts = {};
  tweet_array
    .filter(t => t.source === 'completed' && t.activityType)
    .forEach(t => { counts[t.activityType] = (counts[t.activityType] || 0) + 1; });

  const barData = Object.entries(counts).map(([activity, count]) => ({ activity, count }));
  const barSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Counts per activity',
    data: { values: barData },
    mark: 'bar',
    encoding: {
      x: { field: 'activity', type: 'nominal', sort: '-y', title: 'Activity type' },
      y: { field: 'count', type: 'quantitative', title: 'Tweets' }
    }
  };
  vegaEmbed('#activityVis', barSpec, { actions: false });

  // Determine top 3 activities
  const top3 = topNKeysByCount(counts, 3);

  // Build array for scatter/strip: distance vs day of week for top 3
  const dow = d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(d).getDay()];
  const distRows = tweet_array
    .filter(t => t.source === 'completed' && t.activityType && top3.includes(t.activityType) && Number.isFinite(t.distance))
    .map(t => ({ activity: t.activityType, day: dow(t.time), distance: t.distance }));

  // --- Chart 2: raw distances by day-of-week for top 3 (strip plot)
  const stripSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    description: 'Distance by day for top activities',
    data: { values: distRows },
    mark: { type: 'circle', tooltip: true },
    encoding: {
      x: { field: 'day', type: 'ordinal', sort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], title: 'Day of week' },
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
      x: { field: 'day', type: 'ordinal', sort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], title: 'Day of week' },
      y: { aggregate: 'mean', field: 'distance', type: 'quantitative', title: 'Mean distance (mi)' },
      color: { field: 'activity', type: 'nominal', title: 'Activity' }
    }
  };
  vegaEmbed('#meanDistanceVis', meanSpec, { actions: false });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedRunkeeperTweets().then(parseTweets);
});
