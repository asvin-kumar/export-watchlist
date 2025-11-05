// Content script to extract watchlist data from streaming sites

// Extract Netflix watchlist
function extractNetflixWatchlist() {
  const items = [];
  const seenTitles = new Set();
  
  // Netflix My List page selectors
  const titleCards = document.querySelectorAll('.title-card, .slider-item, [class*="title"], [class*="card"]');
  
  titleCards.forEach(card => {
    try {
      const titleElement = card.querySelector('.fallback-text, .video-title, [class*="title"]');
      const imgElement = card.querySelector('img');
      
      if (titleElement || imgElement) {
        const title = titleElement ? titleElement.textContent.trim() : imgElement?.alt || 'Unknown';
        const imageUrl = imgElement?.src || '';
        
        if (title && title !== 'Unknown' && !seenTitles.has(title)) {
          seenTitles.add(title);
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
  const seenTitles = new Set();
  
  // Prime Video watchlist selectors
  const titleCards = document.querySelectorAll('[data-card-title], .av-hover-wrapper, [class*="card"]');
  
  titleCards.forEach(card => {
    try {
      const titleAttr = card.getAttribute('data-card-title');
      const titleElement = card.querySelector('[class*="title"], h3, h2');
      const imgElement = card.querySelector('img');
      
      const title = titleAttr || titleElement?.textContent.trim() || imgElement?.alt || '';
      const imageUrl = imgElement?.src || '';
      
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
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
  const seenTitles = new Set();
  
  // Disney+ watchlist selectors
  const titleCards = document.querySelectorAll('[class*="card"], [data-testid*="set-item"]');
  
  titleCards.forEach(card => {
    try {
      const titleElement = card.querySelector('[class*="title"], img');
      const imgElement = card.querySelector('img');
      
      const title = titleElement?.textContent?.trim() || imgElement?.alt || '';
      const imageUrl = imgElement?.src || '';
      
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
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
  const seenTitles = new Set();
  
  // Hulu watchlist selectors
  const titleCards = document.querySelectorAll('[class*="card"], [class*="masthead"]');
  
  titleCards.forEach(card => {
    try {
      const titleElement = card.querySelector('[class*="title"], h3, h2, img');
      const imgElement = card.querySelector('img');
      
      const title = titleElement?.textContent?.trim() || imgElement?.alt || '';
      const imageUrl = imgElement?.src || '';
      
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractWatchlist') {
    const hostname = window.location.hostname;
    let items = [];
    
    // Use endsWith to ensure we're on the actual domain, not a subdomain with the name embedded
    if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
      items = extractNetflixWatchlist();
    } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
               hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
      items = extractPrimeVideoWatchlist();
    } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
      items = extractDisneyPlusWatchlist();
    } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
      items = extractHuluWatchlist();
    }
    
    sendResponse({ items: items });
  }
  return true;
});
