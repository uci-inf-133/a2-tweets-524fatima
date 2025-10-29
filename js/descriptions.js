// js/descriptions.js
let allTweets = [];
let writtenTweets = [];

// helpers ---------------------------------------------------
function setAllTextMulti(selectors, value) {
  const sel = Array.isArray(selectors) ? selectors : [selectors];
  sel.forEach(s => document.querySelectorAll(s).forEach(el => el.textContent = value));
}

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
    findOne('#tweetTable') ||
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

  // initial empty state — clear both the count and echoed query
  setAllTextMulti(['.searchCount', '#searchCount'], '0');
  setAllTextMulti(['.searchText', '#searchEcho', '.searchQuery', '.queryText'], '');
  renderRows([]);
}

function addEventHandlerForSearch() {
  const input = findOne('#textFilter') || findOne('#searchText');
  if (!input) return;

  const update = () => {
    const raw = (input.value || '').trim();
    const q = raw.toLowerCase();

    if (!q) {
      setAllTextMulti(['.searchCount', '#searchCount'], '0');
      setAllTextMulti(['.searchText', '#searchEcho', '.searchQuery', '.queryText'], '');
      renderRows([]);
      return;
    }

    // AND-match all words in the query against writtenText
    const words = q.split(/\s+/).filter(Boolean);
    const hits = writtenTweets.filter(t => {
      const text = (t.writtenText || '').toLowerCase();
      return words.every(w => text.includes(w));
    });

    setAllTextMulti(['.searchCount', '#searchCount'], String(hits.length));
    setAllTextMulti(['.searchText', '#searchEcho', '.searchQuery', '.queryText'], raw);
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
