// Popup script

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

// Get platform name from URL
function getPlatformName(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
      return 'Netflix';
    } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
               hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
      return 'Prime Video';
    } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
      return 'Hulu';
    } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
      return 'Disney+';
    } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
      return 'Apple TV+';
    } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
      return 'Max';
    } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
      return 'Peacock';
    } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
      return 'Paramount+';
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Update the navigate message with platform-specific information
function updateNavigateMessage(url) {
  const platformName = getPlatformName(url);
  const watchlistUrl = getWatchlistUrl(url);
  
  if (platformName && watchlistUrl) {
    const messageDiv = document.getElementById('navigate-message');
    const platformSpan = messageDiv.querySelector('.platform-name');
    const linkElement = messageDiv.querySelector('.watchlist-link');
    
    if (platformSpan) {
      platformSpan.textContent = platformName;
    }
    
    if (linkElement) {
      linkElement.href = watchlistUrl;
      linkElement.textContent = watchlistUrl;
    }
  }
}

// Check if URL is on a watchlist page
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

// Check if URL is a streaming site
function isStreamingSite(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const sites = ['netflix.com', 'primevideo.com', 'amazon.com', 'disneyplus.com', 'hulu.com', 'tv.apple.com', 'play.max.com', 'peacocktv.com', 'paramountplus.com'];
    
    return sites.some(site => 
      hostname === `www.${site}` || hostname.endsWith(`.${site}`) || hostname === site
    );
  } catch (e) {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const exportBtn = document.getElementById('export-btn');
  const supportedSiteDiv = document.getElementById('supported-site');
  const unsupportedSiteDiv = document.getElementById('unsupported-site');
  const statusDiv = document.getElementById('status');
  
  // Check if current site is supported by querying the active tab directly
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      const url = tab?.url || '';
      const supported = isStreamingSite(url);

      if (supported) {
        if (isOnWatchlistPage(url)) {
          supportedSiteDiv.classList.remove('hidden');
          unsupportedSiteDiv.classList.add('hidden');
          document.getElementById('navigate-message').classList.add('hidden');
        } else {
          // On a streaming site but not on watchlist page
          supportedSiteDiv.classList.add('hidden');
          unsupportedSiteDiv.classList.add('hidden');
          document.getElementById('navigate-message').classList.remove('hidden');
          // Update the message with platform-specific watchlist URL
          updateNavigateMessage(url);
        }
      } else {
        supportedSiteDiv.classList.add('hidden');
        unsupportedSiteDiv.classList.remove('hidden');
        document.getElementById('navigate-message').classList.add('hidden');
      }
    });
  } catch (e) {
    // Fallback: mark as unsupported
    supportedSiteDiv.classList.add('hidden');
    unsupportedSiteDiv.classList.remove('hidden');
    document.getElementById('navigate-message').classList.add('hidden');
  }

  // Handle export button click
  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    
    showStatus('Extracting watchlist data...', 'info');
    
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if on watchlist page
      if (!isOnWatchlistPage(tab.url)) {
        showStatus('Please navigate to your watchlist page first.', 'error');
        return;
      }
      
      // Extract directly from current page
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractWatchlist' });
        
        if (response && response.items && response.items.length > 0) {
          const items = response.items;
          const platform = response.platform || 'watchlist';

          // Convert to Simple CSV (Position, Title)
          const csv = convertToSimpleCSV(items);
          const filename = `${platform}-watchlist-${new Date().toISOString().split('T')[0]}.csv`;

          // Download CSV
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);

          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
          }, (downloadId) => {
            if (chrome.runtime.lastError) {
              showStatus('Error downloading file: ' + chrome.runtime.lastError.message, 'error');
            } else {
              showStatus(`Successfully exported ${items.length} items!`, 'success');
            }
          });
        } else {
          showStatus('No watchlist items found on this page.', 'error');
        }
      } catch (e) {
        console.error('Error sending message to content script:', e);
        showStatus('Failed to communicate with page content. Please refresh the page and try again.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('Error: ' + error.message, 'error');
    } finally {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export Watchlist';
    }
  });
});

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

// Convert data to Simple CSV format (used by popup export)
function convertToSimpleCSV(data) {
  if (!data || data.length === 0) return '';

  // Simple CSV format headers
  const headers = ['Position', 'Title'];
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const position = i + 1;
    const title = item.title || '';

    // Build CSV row
    const row = [
      position,                    // Position
      escapeCSVValue(title)        // Title
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

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
}
