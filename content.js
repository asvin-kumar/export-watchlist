// Content script to extract watchlist data from streaming sites

// Check if we're on the correct page for each platform
function isOnWatchlistPage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
    // Netflix: must be on /browse/my-list page
    return pathname.includes('/browse/my-list');
  } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
             hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
    // Prime Video: must be on watchlist page
    return pathname.includes('/watchlist') || pathname.includes('/wl');
  } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
    // Hulu: must be on my-stuff page
    return pathname.includes('/my-stuff');
  } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
    // Disney+: must be on watchlist page
    return pathname.includes('/watchlist');
  } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
    // Apple TV+: must be on library page
    return pathname.includes('/library');
  } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
    // Max: must be on watchlist page
    return pathname.includes('/lists/watchlist');
  } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
    // Peacock: must be on my-stuff page
    return pathname.includes('/watch/my-stuff');
  } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
    // Paramount+: must be on watchlist page
    return pathname.includes('/account/watchlist');
  }
  
  return false;
}

// Get platform name from hostname
function getPlatformName() {
  const hostname = window.location.hostname;
  
  if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
    return 'netflix';
  } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
             hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
    return 'amazon';
  } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
    return 'hulu';
  } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
    return 'disney';
  } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
    return 'appletv';
  } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
    return 'max';
  } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
    return 'peacock';
  } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
    return 'paramount';
  }
  
  return 'watchlist';
}

// Constants for scroll behavior
const SCROLL_CHECK_INTERVAL = 1000; // Time between scroll attempts (ms)
const SCROLL_WAIT_TIME = 800; // Time to wait after scroll for content to load (ms)
const MAX_SCROLL_ATTEMPTS = 100; // Maximum number of scroll attempts
const MAX_UNCHANGED_ATTEMPTS = 5; // Stop after this many attempts with no change
const FINAL_RENDER_DELAY = 500; // Final delay for pending renders (ms)

// Scroll to load all lazy-loaded content
async function scrollToLoadAll() {
  return new Promise((resolve) => {
    let lastHeight = document.body.scrollHeight;
    let scrollAttempts = 0;
    let unchangedAttempts = 0;
    
    const scrollInterval = setInterval(() => {
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
      
      // Wait a bit for content to load
      setTimeout(() => {
        const newHeight = document.body.scrollHeight;
        scrollAttempts++;
        
        // Check if height changed
        if (newHeight === lastHeight) {
          unchangedAttempts++;
        } else {
          unchangedAttempts = 0; // Reset counter if content loaded
        }
        
        // Stop if no new content loaded for several attempts or max attempts reached
        if (unchangedAttempts >= MAX_UNCHANGED_ATTEMPTS || scrollAttempts >= MAX_SCROLL_ATTEMPTS) {
          clearInterval(scrollInterval);
          // Scroll back to top
          window.scrollTo(0, 0);
          // Give a final moment for any pending renders
          setTimeout(() => resolve(), FINAL_RENDER_DELAY);
        }
        
        lastHeight = newHeight;
      }, SCROLL_WAIT_TIME);
    }, SCROLL_CHECK_INTERVAL);
  });
}

// Extract Netflix watchlist
async function extractNetflixWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
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
async function extractPrimeVideoWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
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
async function extractDisneyPlusWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
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
async function extractHuluWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
  const items = [];
  const seenTitles = new Set();
  
  // Hulu my-stuff page selectors - updated for better compatibility
  const titleCards = document.querySelectorAll('[class*="card"], [class*="masthead"], [class*="tile"], [data-automationid*="card"]');
  
  titleCards.forEach(card => {
    try {
      const titleElement = card.querySelector('[class*="title"], h3, h2, h4, img, [class*="name"]');
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

// Extract Apple TV+ watchlist
async function extractAppleTVWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
  const items = [];
  const seenTitles = new Set();
  
  // Apple TV+ library page selectors
  const titleCards = document.querySelectorAll('[class*="shelf-grid-item"], [class*="canvas-lockup"], [data-metrics-loc*="shelfItem"]');
  
  titleCards.forEach(card => {
    try {
      const titleElement = card.querySelector('[class*="title"], [class*="label"], img');
      const imgElement = card.querySelector('img');
      
      const title = titleElement?.textContent?.trim() || imgElement?.alt || '';
      const imageUrl = imgElement?.src || '';
      
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
        items.push({
          title: title,
          type: 'Movie/Show',
          platform: 'Apple TV+',
          imageUrl: imageUrl,
          extractedDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (e) {
      console.error('Error extracting Apple TV+ item:', e);
    }
  });
  
  return items;
}

// Extract Max watchlist
async function extractMaxWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
  const items = [];
  const seenTitles = new Set();
  
  // Max watchlist selectors
  const titleCards = document.querySelectorAll('[class*="card"], [class*="tile"], [data-testid*="card"]');
  
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
          platform: 'Max',
          imageUrl: imageUrl,
          extractedDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (e) {
      console.error('Error extracting Max item:', e);
    }
  });
  
  return items;
}

// Extract Peacock watchlist
async function extractPeacockWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
  const items = [];
  const seenTitles = new Set();
  
  // Peacock my-stuff page selectors
  const titleCards = document.querySelectorAll('[class*="tile"], [class*="card"], [data-testid*="tile"]');
  
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
          platform: 'Peacock',
          imageUrl: imageUrl,
          extractedDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (e) {
      console.error('Error extracting Peacock item:', e);
    }
  });
  
  return items;
}

// Extract Paramount+ watchlist
async function extractParamountPlusWatchlist() {
  // Wait for lazy-loaded content
  await scrollToLoadAll();
  
  const items = [];
  const seenTitles = new Set();
  
  // Paramount+ watchlist selectors
  const titleCards = document.querySelectorAll('[class*="tile"], [class*="card"], [data-testid*="card"]');
  
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
          platform: 'Paramount+',
          imageUrl: imageUrl,
          extractedDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (e) {
      console.error('Error extracting Paramount+ item:', e);
    }
  });
  
  return items;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractWatchlist') {
    const hostname = window.location.hostname;
    
    // Check if we're on the correct page
    if (!isOnWatchlistPage()) {
      // Return error - background script will handle loading the page
      sendResponse({ 
        error: true, 
        message: 'Not on watchlist page',
        items: [] 
      });
      return true;
    }
    
    // Extract items based on platform (now all async)
    const extractPromise = (async () => {
      let items = [];
      
      if (hostname === 'www.netflix.com' || hostname.endsWith('.netflix.com')) {
        items = await extractNetflixWatchlist();
      } else if (hostname === 'www.primevideo.com' || hostname.endsWith('.primevideo.com') || 
                 hostname === 'www.amazon.com' || hostname.endsWith('.amazon.com')) {
        items = await extractPrimeVideoWatchlist();
      } else if (hostname === 'www.disneyplus.com' || hostname.endsWith('.disneyplus.com')) {
        items = await extractDisneyPlusWatchlist();
      } else if (hostname === 'www.hulu.com' || hostname.endsWith('.hulu.com')) {
        items = await extractHuluWatchlist();
      } else if (hostname === 'tv.apple.com' || hostname.endsWith('.apple.com')) {
        items = await extractAppleTVWatchlist();
      } else if (hostname === 'play.max.com' || hostname.endsWith('.max.com')) {
        items = await extractMaxWatchlist();
      } else if (hostname === 'www.peacocktv.com' || hostname.endsWith('.peacocktv.com')) {
        items = await extractPeacockWatchlist();
      } else if (hostname === 'www.paramountplus.com' || hostname.endsWith('.paramountplus.com')) {
        items = await extractParamountPlusWatchlist();
      }
      
      return items;
    })();
    
    extractPromise.then(items => {
      sendResponse({ 
        items: items,
        platform: getPlatformName()
      });
    }).catch(error => {
      console.error('Error extracting watchlist:', error);
      sendResponse({ 
        error: true,
        message: error.message,
        items: [] 
      });
    });
    
    return true; // Keep message channel open for async response
  }
  return true;
});
