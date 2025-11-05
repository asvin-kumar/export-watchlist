// Minimal background service worker to update the extension icon
// based on whether the current tab is on a watchlist page.

// Check if URL is on a watchlist page (same logic as popup/content)
function isOnStreamingPage(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
      return true;
    } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
               hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
      return true;
    } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
      return true;
    } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
      return true;
    } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
      return true;
    } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
      return true;
    } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
      return true;
    } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

// Update the extension icon for a given tabId
async function updateIcon(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const onWatchlist = isOnStreamingPage(tab.url);

    const iconPaths = onWatchlist ? {
      16: 'icons/icon-active-16.png',
      48: 'icons/icon-active-48.png',
      128: 'icons/icon-active-128.png'
    } : {
      16: 'icons/icon-inactive-16.png',
      48: 'icons/icon-inactive-48.png',
      128: 'icons/icon-inactive-128.png'
    };

    await chrome.action.setIcon({ tabId, path: iconPaths });
  } catch (e) {
    // ignore errors (tab may not exist or be inaccessible)
    // console.error('updateIcon error', e);
  }
}

// Listen for tab activation and updates
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateIcon(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateIcon(tabId);
  }
});

// Also update icon on install to cover the current active tab
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) updateIcon(tabs[0].id);
  });
});
