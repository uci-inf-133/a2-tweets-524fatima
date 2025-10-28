let writtenTweets = [];

function parseTweets(runkeeper_tweets) {
  if (!runkeeper_tweets) { alert('No tweets returned'); return; }

  const all = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));
  // only tweets with user-written text
  writtenTweets = all.filter(t => t.written);
}

function renderRows(rows) {
  // table body id in descriptions.html
  const tbody = document.querySelector('#results tbody');
  tbody.innerHTML = rows.map(t => t.getHTMLTableRow()).join('');
}

function addEventHandlerForSearch() {
  const input = document.getElementById('searchText');        // text box id
  const countSpan = document.getElementById('searchCount');   // count span id
  const echoSpan  = document.getElementById('searchEcho');    // optional: show the current query

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      countSpan.textContent = '0';
      echoSpan && (echoSpan.textContent = '');
      renderRows([]);
      return;
    }
    const hits = writtenTweets.filter(t => t.writtenText.toLowerCase().includes(q));
    countSpan.textContent = String(hits.length);
    echoSpan && (echoSpan.textContent = q);
    renderRows(hits);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  addEventHandlerForSearch();
  loadSavedRunkeeperTweets().then(parseTweets);
});
