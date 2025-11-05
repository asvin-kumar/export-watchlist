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
      
      // Execute content script to extract data
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractWatchlistData
      });
      
      if (results && results[0] && results[0].result) {
        const items = results[0].result;
        
        if (items.length > 0) {
          // Convert to CSV
          const csv = convertToCSV(items);
          const filename = `watchlist-${new Date().toISOString().split('T')[0]}.csv`;
          
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
      } else {
        showStatus('Could not extract watchlist data.', 'error');
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

// Function to extract watchlist data (injected into page)
function extractWatchlistData() {
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
  
  // Extract Netflix watchlist
  function extractNetflixWatchlist() {
    const items = [];
    const titleCards = document.querySelectorAll('.title-card, .slider-item, [class*="title"], [class*="card"]');
    
    titleCards.forEach(card => {
      try {
        const titleElement = card.querySelector('.fallback-text, .video-title, [class*="title"]');
        const imgElement = card.querySelector('img');
        
        if (titleElement || imgElement) {
          const title = titleElement ? titleElement.textContent.trim() : imgElement?.alt || 'Unknown';
          const imageUrl = imgElement?.src || '';
          
          if (title && title !== 'Unknown' && !items.some(item => item.title === title)) {
            items.push({
              title: title,
              type: 'Movie/Show',
              platform: 'Netflix',
              imageUrl: imageUrl,
              extractedDate: new Date().toISOString().split('T')[0]
            });
          }
        }
      } catch (e) {
        console.error('Error extracting Netflix item:', e);
      }
    });
    
    return items;
  }
  
  // Extract Prime Video watchlist
  function extractPrimeVideoWatchlist() {
    const items = [];
    const titleCards = document.querySelectorAll('[data-card-title], .av-hover-wrapper, [class*="card"]');
    
    titleCards.forEach(card => {
      try {
        const titleAttr = card.getAttribute('data-card-title');
        const titleElement = card.querySelector('[class*="title"], h3, h2');
        const imgElement = card.querySelector('img');
        
        const title = titleAttr || titleElement?.textContent.trim() || imgElement?.alt || '';
        const imageUrl = imgElement?.src || '';
        
        if (title && !items.some(item => item.title === title)) {
          items.push({
            title: title,
            type: 'Movie/Show',
            platform: 'Prime Video',
            imageUrl: imageUrl,
            extractedDate: new Date().toISOString().split('T')[0]
          });
        }
      } catch (e) {
        console.error('Error extracting Prime Video item:', e);
      }
    });
    
    return items;
  }
  
  // Extract Disney+ watchlist
  function extractDisneyPlusWatchlist() {
    const items = [];
    const titleCards = document.querySelectorAll('[class*="card"], [data-testid*="set-item"]');
    
    titleCards.forEach(card => {
      try {
        const titleElement = card.querySelector('[class*="title"], img');
        const imgElement = card.querySelector('img');
        
        const title = titleElement?.textContent?.trim() || imgElement?.alt || '';
        const imageUrl = imgElement?.src || '';
        
        if (title && !items.some(item => item.title === title)) {
          items.push({
            title: title,
            type: 'Movie/Show',
            platform: 'Disney+',
            imageUrl: imageUrl,
            extractedDate: new Date().toISOString().split('T')[0]
          });
        }
      } catch (e) {
        console.error('Error extracting Disney+ item:', e);
      }
    });
    
    return items;
  }
  
  // Extract Hulu watchlist
  function extractHuluWatchlist() {
    const items = [];
    const titleCards = document.querySelectorAll('[class*="card"], [class*="masthead"]');
    
    titleCards.forEach(card => {
      try {
        const titleElement = card.querySelector('[class*="title"], h3, h2, img');
        const imgElement = card.querySelector('img');
        
        const title = titleElement?.textContent?.trim() || imgElement?.alt || '';
        const imageUrl = imgElement?.src || '';
        
        if (title && !items.some(item => item.title === title)) {
          items.push({
            title: title,
            type: 'Movie/Show',
            platform: 'Hulu',
            imageUrl: imageUrl,
            extractedDate: new Date().toISOString().split('T')[0]
          });
        }
      } catch (e) {
        console.error('Error extracting Hulu item:', e);
      }
    });
    
    return items;
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

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
}
