// js/descriptions.js
let allTweets = [];
let writtenTweets = [];

/* -------------------- helpers -------------------- */
function findOne(...selectors) {
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}

function setAllTextMulti(selectors, value) {
  const sel = Array.isArray(selectors) ? selectors : [selectors];
  sel.forEach(s => document.querySelectorAll(s).forEach(el => (el.textContent = value)));
}

function renderRows(rows) {
  const tbody =
    findOne('#tweetTable') ||          // starter id
    findOne('#tweetTableBody') ||
    findOne('#results tbody') ||       // some templates use a wrapper
    findOne('#tweet-table-body');
  if (!tbody) return;
  tbody.innerHTML = rows.map((t, i) => t.getHTMLTableRow(i + 1)).join('');
}

function countEls(selector) {
  return document.querySelectorAll(selector).length;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Safely update the summary line.
 *  1) If placeholders exist (.searchCount / .searchText …), fill them.
 *  2) Otherwise, find a **leaf** element (no children) among p/div/span/h1–h5
 *     that contains "Tweets contain the text" (case-insensitive) and rewrite only that.
 */
function updateSearchSummary(raw, count) {
  const countTargets = ['.searchCount', '#searchCount'];
  const textTargets  = ['.searchText', '#searchEcho', '.searchQuery', '.queryText'];

  const hadCount = countTargets.some(sel => countEls(sel) > 0);
  const hadText  = textTargets.some(sel  => countEls(sel)  > 0);

  setAllTextMulti(countTargets, String(count));
  setAllTextMulti(textTargets,  raw);

  if (!hadCount || !hadText) {
    const needle = /tweets contain the text/i;
    const safeRaw = escapeHtml(raw);

    // Only consider leaf elements in common text containers
    const candidates = Array.from(
      document.querySelectorAll('p,div,span,h1,h2,h3,h4,h5')
    ).filter(el =>
      el !== document.body &&
      el.children.length === 0 &&
      needle.test(el.textContent || '')
    );

    // Pick the first matching leaf; if none, do nothing
    const target = candidates[0];
    if (target) {
      target.textContent = `${count} Tweets contain the text '${raw}'.`;
    }
  }
}

/* ---------------------- core ---------------------- */
function parseTweets(runkeeper_tweets) {
  if (!Array.isArray(runkeeper_tweets)) {
    alert('No tweets returned');
    return;
  }
  allTweets = runkeeper_tweets.map(t => new Tweet(t.text, t.created_at));
  // only tweets with user-written text
  writtenTweets = allTweets.filter(t => t.written);

  // initial state
  updateSearchSummary('', 0);
  renderRows([]);
}

function addEventHandlerForSearch() {
  const input = findOne('#textFilter') || findOne('#searchText');
  if (!input) return;

  const update = () => {
    const raw = (input.value || '').trim();
    const q = raw.toLowerCase();

    if (!q) {
      updateSearchSummary('', 0);
      renderRows([]);
      return;
    }

    // AND-match all words in the query against writtenText
    const words = q.split(/\s+/).filter(Boolean);
    const hits = writtenTweets.filter(t => {
      const text = (t.writtenText || '').toLowerCase();
      return words.every(w => text.includes(w));
    });

    updateSearchSummary(raw, hits.length);
    renderRows(hits);
  };

  // small debounce for smoother typing
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(update, 150);
  });
}

/* -------------------- bootstrap ------------------- */
document.addEventListener('DOMContentLoaded', () => {
  addEventHandlerForSearch();

  const loader =
    (typeof getSavedTweets === 'function') ? getSavedTweets :
    (typeof loadSavedRunkeeperTweets === 'function') ? loadSavedRunkeeperTweets :
    null;

  if (!loader) {
    console.error('No tweet loader found (getSavedTweets / loadSavedRunkeeperTweets).');
    alert('Failed to load tweets.');
    return;
  }

  loader()
    .then(parseTweets)
    .catch(err => {
      console.error(err);
      alert('Failed to load tweets.');
    });
});
