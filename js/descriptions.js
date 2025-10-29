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

/** Robustly update the summary sentence above the table.
 *  1) If the template has placeholders (.searchCount / .searchText ...) we fill them.
 *  2) Otherwise, we search *all elements* for a line containing "Tweets contain the text"
 *     (case-insensitive) and rewrite the whole line with correct count & query.
 */
function updateSearchSummary(raw, count) {
  const countTargets = ['.searchCount', '#searchCount'];
  const textTargets  = ['.searchText', '#searchEcho', '.searchQuery', '.queryText'];

  const hadCount = countTargets.some(sel => countEls(sel) > 0);
  const hadText  = textTargets.some(sel  => countEls(sel)  > 0);

  setAllTextMulti(countTargets, String(count));
  setAllTextMulti(textTargets,  raw);

  if (!hadCount || !hadText) {
    // Fallback: rewrite any element whose text mentions the phrase
    const nodes = Array.from(document.querySelectorAll('*'));
    const needle = /tweets contain the text/i;
    const safeRaw = escapeHtml(raw);

    for (const node of nodes) {
      const txt = node.textContent || '';
      if (needle.test(txt)) {
        // Use textContent (safe). We don't try to partially replace; we emit a clean line.
        node.textContent = `${count} Tweets contain the text '${raw}'.`;
        // If this node also held the numeric part elsewhere, this one rewrite is enough.
      }
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
