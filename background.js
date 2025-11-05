// Background service worker for managing extension state and context menu

// Supported streaming platforms
const STREAMING_SITES = [
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'disneyplus.com',
  'hulu.com'
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
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateIcon(tabId);
  }
});

// Function to check if URL is a streaming site
function isStreamingSite(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return STREAMING_SITES.some(site => urlObj.hostname.includes(site));
  } catch (e) {
    return false;
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

// Export watchlist from current tab
async function exportWatchlist(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractWatchlist
    });
    
    if (results && results[0] && results[0].result) {
      const data = results[0].result;
      if (data.length > 0) {
        const csv = convertToCSV(data);
        const filename = `watchlist-${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
      } else {
        console.log('No watchlist items found');
      }
    }
  } catch (e) {
    console.error('Error exporting watchlist:', e);
  }
}

// Function injected into page to extract watchlist
function extractWatchlist() {
  const hostname = window.location.hostname;
  let items = [];
  
  if (hostname.includes('netflix.com')) {
    items = extractNetflixWatchlist();
  } else if (hostname.includes('primevideo.com') || hostname.includes('amazon.com')) {
    items = extractPrimeVideoWatchlist();
  } else if (hostname.includes('disneyplus.com')) {
    items = extractDisneyPlusWatchlist();
  } else if (hostname.includes('hulu.com')) {
    items = extractHuluWatchlist();
  }
  
  return items;
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
