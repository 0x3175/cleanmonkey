// Default script seeded on first install
const DEFAULT_SCRIPTS = [
    {
        id: 'douban-enhancer',
        name: 'Douban Enhancer',
        matches: '*://*.douban.com/subject/*',
        enabled: true,
        code: `
function makeAnchor() {
  const anchor = document.createElement('a');
  anchor.innerHTML = '&#9658;';
  anchor.setAttribute('style', 'margin-left: 10px;');
  anchor.target = '_blank';
  anchor.rel = 'noreferrer noopener';
  return anchor;
}

function addPlayMovieButton() {
  const movieName = window.document.title.slice(0, -5);
  const year = document.querySelector('#content .year');
  if (!year) return;
  const anchor = makeAnchor();
  anchor.href = 'https://www.iyf.tv/search/' + movieName;
  year.after(anchor);
}

function addPlayMusicButton() {
  const albumName = document.querySelector('#wrapper h1 span');
  if (!albumName) return;
  const anchor = makeAnchor();
  anchor.href = 'https://open.spotify.com/search/' + albumName.textContent + '/albums';
  albumName.after(anchor);
}

function addCopyBookHotkey() {
  const bookName = document.querySelector('#wrapper h1 span');
  if (!bookName) return;
  document.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
      navigator.clipboard.writeText(bookName.textContent);
    }
  });
}

function addImdbLink() {
  const xpath = "//span[text()='IMDb:']";
  const matchingElement = document.evaluate(
    xpath, document, null,
    XPathResult.FIRST_ORDERED_NODE_TYPE, null
  ).singleNodeValue;
  if (matchingElement) {
    const imdbId = matchingElement.nextSibling.textContent.trim();
    matchingElement.nextSibling.remove();
    const imdbLink = document.createElement('a');
    imdbLink.innerText = imdbId;
    imdbLink.setAttribute('style', 'margin-left: 4px;');
    imdbLink.href = 'https://www.imdb.com/title/' + imdbId;
    imdbLink.target = '_blank';
    imdbLink.rel = 'noreferrer noopener';
    matchingElement.parentNode.insertBefore(imdbLink, matchingElement.nextSibling);
  }
}

if (window.location.host === 'movie.douban.com') {
  addPlayMovieButton();
  addImdbLink();
} else if (window.location.host === 'music.douban.com') {
  addPlayMusicButton();
} else if (window.location.host === 'book.douban.com') {
  addCopyBookHotkey();
}
`.trim()
    }
];

// Seed default scripts on first install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.storage.local.set({ scripts: DEFAULT_SCRIPTS });
    }
});

// Convert a match pattern like *://*.douban.com/subject/* to a regex
function matchPatternToRegex(pattern) {
    // Escape regex special chars, then convert * to .*
    let regex = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
    return new RegExp('^' + regex + '$');
}

// Check if a URL matches a pattern string (supports multiple patterns separated by newlines)
function urlMatches(url, patternStr) {
    const patterns = patternStr.split('\n').map(p => p.trim()).filter(Boolean);
    return patterns.some(pattern => {
        try {
            return matchPatternToRegex(pattern).test(url);
        } catch {
            return false;
        }
    });
}

// Inject matching scripts when a page finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;

    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

    chrome.storage.local.get('scripts', (data) => {
        const scripts = data.scripts || [];
        for (const script of scripts) {
            if (!script.enabled) continue;
            if (urlMatches(tab.url, script.matches)) {
                chrome.scripting.executeScript({
                    target: { tabId },
                    func: (code) => {
                        const fn = new Function(code);
                        fn();
                    },
                    args: [script.code],
                    world: 'MAIN'
                }).catch(err => console.warn(`Script "${script.name}" failed:`, err));
            }
        }
    });
});
