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
  
  // Handle export button click
  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    
    showStatus('Extracting watchlist data...', 'info');
    
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to extract data
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractWatchlist' });
      
      // Handle redirect
      if (response && response.redirected) {
        showStatus(`Redirecting to ${response.platform} watchlist page...`, 'info');
        setTimeout(() => window.close(), 2000);
        return;
      }
      
      // Handle error
      if (response && response.error) {
        showStatus(response.message || 'Error extracting watchlist', 'error');
        return;
      }
      
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
