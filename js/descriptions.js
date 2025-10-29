// js/descriptions.js
let allTweets = [];
let writtenTweets = [];

// helpers ---------------------------------------------------
function findOne(...selectors) {
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}
function setAllText(selectors, value) {
  document.querySelectorAll(selectors).forEach(el => el.textContent = value);
}
function renderRows(rows) {
  const tbody =
    findOne('#tweetTable') ||                 // starter: <tbody id="tweetTable">
    findOne('#tweetTableBody') ||
    findOne('#results tbody') ||
    findOne('#tweet-table-body');
  if (!tbody) return;
  tbody.innerHTML = rows.map((t, i) => t.getHTMLTableRow(i + 1)).join('');
}

// core ------------------------------------------------------
function parseTweets(runkeeper_tweets) {
  if (!Array.isArray(runkeeper_tweets)) { alert('No tweets returned'); return; }
  allTweets = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));
  writtenTweets = allTweets.filter(t => t.written);  // only those with user text
  // initial empty state
  setAllText('.searchCount, #searchCount', '0');
  setAllText('.searchText,  #searchEcho', '');
  renderRows([]);
}

function addEventHandlerForSearch() {
  const input =
    findOne('#textFilter') || // starter id
    findOne('#searchText');   // your earlier id

  const update = () => {
    const q = (input.value || '').trim().toLowerCase();
    if (!q) {
      setAllText('.searchCount, #searchCount', '0');
      setAllText('.searchText,  #searchEcho', '');
      renderRows([]);
      return;
    }
    const hits = writtenTweets.filter(t => (t.writtenText || '').toLowerCase().includes(q));
    setAllText('.searchCount, #searchCount', String(hits.length));
    setAllText('.searchText,  #searchEcho', q);
    renderRows(hits);
  };

  // small debounce so it feels smooth
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(update, 150);
  });
}

// bootstrap -------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  addEventHandlerForSearch();

  // support either loader name from the starter
  const loader = (typeof getSavedTweets === 'function')
    ? getSavedTweets
    : (typeof loadSavedRunkeeperTweets === 'function')
      ? loadSavedRunkeeperTweets
      : null;

  if (!loader) {
    console.error('No tweet loader found (getSavedTweets / loadSavedRunkeeperTweets).');
    alert('Failed to load tweets.');
    return;
  }

  loader().then(parseTweets).catch(err => {
    console.error(err);
    alert('Failed to load tweets.');
  });
});
