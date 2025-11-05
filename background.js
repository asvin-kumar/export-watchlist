// Background service worker for managing extension state and context menu

// Supported streaming platforms
const STREAMING_SITES = [
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'disneyplus.com',
  'hulu.com',
  'tv.apple.com',
  'play.max.com',
  'peacocktv.com',
  'paramountplus.com'
];

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'export-watchlist',
    title: 'Export Watchlist to CSV',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'export-watchlist') {
    exportWatchlist(tab.id);
  }
});

// Update icon based on current tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  updateIcon(activeInfo.tabId);
  updateContextMenu(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateIcon(tabId);
    updateContextMenu(tabId);
  }
});

// Function to check if URL is a streaming site
function isStreamingSite(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check if hostname matches our supported sites
    return STREAMING_SITES.some(site => 
      hostname === `www.${site}` || hostname.endsWith(`.${site}`) || hostname === site
    );
  } catch (e) {
    return false;
  }
}

// Function to check if URL is on a watchlist page
function isOnWatchlistPage(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
      return pathname.includes('/browse/my-list');
    } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
               hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
      return pathname.includes('/watchlist') || pathname.includes('/wl');
    } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
      return pathname.includes('/my-stuff');
    } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
      return pathname.includes('/watchlist');
    } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
      return pathname.includes('/library');
    } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
      return pathname.includes('/lists/watchlist');
    } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
      return pathname.includes('/watch/my-stuff');
    } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
      return pathname.includes('/account/watchlist');
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

// Update context menu based on current page
async function updateContextMenu(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const isWatchlistPage = isOnWatchlistPage(tab.url);
    
    // Update context menu to only show on watchlist pages
    chrome.contextMenus.update('export-watchlist', {
      enabled: isWatchlistPage
    });
  } catch (e) {
    console.error('Error updating context menu:', e);
  }
}

// Update extension icon based on site
async function updateIcon(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const isSupported = isStreamingSite(tab.url);
    
    const iconPaths = isSupported ? {
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
    console.error('Error updating icon:', e);
  }
}

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportWatchlist') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        exportWatchlist(tabs[0].id);
      }
    });
    return true;
  }
  
  if (request.action === 'checkSite') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const isSupported = isStreamingSite(tabs[0].url);
        sendResponse({ isSupported, url: tabs[0].url });
      }
    });
    return true;
  }
  
  if (request.action === 'downloadCSV') {
    downloadCSV(request.data, request.filename);
    sendResponse({ success: true });
    return true;
  }
});

// Get watchlist URL for a platform
function getWatchlistUrl(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
      return 'https://www.netflix.com/browse/my-list';
    } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com')) {
      return 'https://www.primevideo.com/watchlist';
    } else if (hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
      return 'https://www.amazon.com/gp/video/watchlist';
    } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
      return 'https://www.hulu.com/my-stuff';
    } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
      return 'https://www.disneyplus.com/watchlist';
    } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
      return 'https://tv.apple.com/us/library';
    } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
      return 'https://play.max.com/lists/watchlist';
    } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
      return 'https://www.peacocktv.com/watch/my-stuff';
    } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
      return 'https://www.paramountplus.com/account/watchlist';
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Export watchlist from current tab
async function exportWatchlist(tabId) {
  try {
    const currentTab = await chrome.tabs.get(tabId);
    const currentUrl = currentTab.url;
    
    // Check if on watchlist page
    if (!isOnWatchlistPage(currentUrl)) {
      console.log('Not on watchlist page. User should navigate there first.');
      return;
    }
    
    // Extract directly from current page
    try {
      const response = await chrome.tabs.sendMessage(tabId, { action: 'extractWatchlist' });
      
      if (response && response.items && response.items.length > 0) {
        const csv = convertToIMDBCSV(response.items);
        const platform = response.platform || 'watchlist';
        const filename = `${platform}-watchlist-${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
      } else {
        console.log('No watchlist items found');
      }
    } catch (e) {
      console.error('Error sending message to content script:', e);
    }
  } catch (e) {
    console.error('Error exporting watchlist:', e);
  }
}

// Convert data to CSV format
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
        ? `"${escaped}"` 
        : escaped;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Convert data to IMDB-compatible CSV format
function convertToIMDBCSV(data) {
  if (!data || data.length === 0) return '';
  
  // IMDB CSV format headers
  const headers = ['Position', 'Const', 'Created', 'Modified', 'Description', 'Title', 'Title Type', 'Directors', 'You Rated', 'IMDb Rating', 'Runtime (mins)', 'Year', 'Genres', 'Num Votes', 'Release Date', 'URL'];
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const position = i + 1;
    const created = item.extractedDate || new Date().toISOString().split('T')[0];
    const title = item.title || '';
    
    // Build CSV row with IMDB format
    const row = [
      position,                    // Position
      '',                          // Const (IMDB ID - not available)
      created,                     // Created
      created,                     // Modified
      `From ${item.platform}`,     // Description
      escapeCSVValue(title),       // Title
      '',                          // Title Type (movie/tvSeries - not available)
      '',                          // Directors
      '',                          // You Rated
      '',                          // IMDb Rating
      '',                          // Runtime (mins)
      '',                          // Year
      '',                          // Genres
      '',                          // Num Votes
      '',                          // Release Date
      ''                           // URL
    ];
    
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

// Escape CSV value
function escapeCSVValue(value) {
  if (!value) return '';
  const stringValue = String(value);
  const escaped = stringValue.replace(/"/g, '""');
  return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
    ? `"${escaped}"` 
    : escaped;
}

// Download CSV file
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}
