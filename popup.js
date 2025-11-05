// Popup script

document.addEventListener('DOMContentLoaded', async () => {
  const exportBtn = document.getElementById('export-btn');
  const supportedSiteDiv = document.getElementById('supported-site');
  const unsupportedSiteDiv = document.getElementById('unsupported-site');
  const statusDiv = document.getElementById('status');
  
  // Check if current site is supported
  chrome.runtime.sendMessage({ action: 'checkSite' }, (response) => {
    if (response && response.isSupported) {
      supportedSiteDiv.classList.remove('hidden');
      unsupportedSiteDiv.classList.add('hidden');
    } else {
      supportedSiteDiv.classList.add('hidden');
      unsupportedSiteDiv.classList.remove('hidden');
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
    }
    
    return null;
  } catch (e) {
    return null;
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
    const sites = ['netflix.com', 'primevideo.com', 'amazon.com', 'disneyplus.com', 'hulu.com'];
    
    return sites.some(site => 
      hostname === `www.${site}` || hostname.endsWith(`.${site}`)
    );
  } catch (e) {
    return false;
  }
}

  // Handle export button click
  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    
    showStatus('Extracting watchlist data...', 'info');
    
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if already on watchlist page
      if (isOnWatchlistPage(tab.url)) {
        // Extract directly from current page
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractWatchlist' });
          
          if (response && response.items && response.items.length > 0) {
            const items = response.items;
            const platform = response.platform || 'watchlist';
            
            // Convert to IMDB-compatible CSV
            const csv = convertToIMDBCSV(items);
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
      } else if (isStreamingSite(tab.url)) {
        // Not on watchlist page, load it in background
        const watchlistUrl = getWatchlistUrl(tab.url);
        
        if (watchlistUrl) {
          showStatus('Loading watchlist page in background...', 'info');
          
          // Create a new tab in the background
          const newTab = await chrome.tabs.create({
            url: watchlistUrl,
            active: false
          });
          
          // Wait for the tab to finish loading
          await new Promise((resolve) => {
            const listener = async (updatedTabId, changeInfo) => {
              if (updatedTabId === newTab.id && changeInfo.status === 'complete') {
                // Give it extra time to fully load content
                setTimeout(async () => {
                  try {
                    showStatus('Extracting data from watchlist...', 'info');
                    const response = await chrome.tabs.sendMessage(newTab.id, { action: 'extractWatchlist' });
                    
                    if (response && response.items && response.items.length > 0) {
                      const items = response.items;
                      const platform = response.platform || 'watchlist';
                      
                      // Convert to IMDB-compatible CSV
                      const csv = convertToIMDBCSV(items);
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
                      showStatus('No watchlist items found.', 'error');
                    }
                  } catch (e) {
                    console.error('Error extracting from background tab:', e);
                    showStatus('Error extracting watchlist data.', 'error');
                  } finally {
                    // Close the background tab
                    chrome.tabs.remove(newTab.id);
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                  }
                }, 5000);
              }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
          });
        } else {
          showStatus('Unable to determine watchlist URL.', 'error');
        }
      } else {
        showStatus('Please navigate to a supported streaming site.', 'error');
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

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
}
