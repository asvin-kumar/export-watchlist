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
  } else if (hostname === 'www.imdb.com' || hostname.endsWith('.imdb.com')) {
    return 'imdb';
  }
  
  return 'watchlist';
}

// IMDB import functionality
async function getIMDBAWSKey() {
  // Extract AWS credentials from IMDB page
  // IMDB typically includes AWS credentials in page scripts or configs
  try {
    // Look for Next.js data or inline scripts with AWS config
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent;
      // Search for AWS credentials pattern (this may vary)
      if (content.includes('AWS') || content.includes('aws')) {
        // Try to extract credentials from script content
        const credMatch = content.match(/["'](?:AWS_)?ACCESS_KEY["']:\s*["']([^"']+)["']/i);
        if (credMatch) {
          return credMatch[1];
        }
      }
    }
    
    // Alternative: Use IMDB's own search API endpoint without explicit AWS key
    // IMDB's search is accessible through their public endpoints
    return null; // Will use IMDB's public search endpoint instead
  } catch (e) {
    console.error('Error getting AWS key:', e);
    return null;
  }
}

async function searchIMDBTitle(title) {
  // Search IMDB for a title and return content IDs
  // Note: This uses IMDB's public suggestion API which may change without notice.
  // If this endpoint stops working, alternative scraping methods may be needed.
  try {
    const searchQuery = encodeURIComponent(title);
    const response = await fetch(`https://v3.sg.media-imdb.com/suggestion/x/${searchQuery}.json`);
    
    if (!response.ok) {
      // API endpoint may have changed or be unavailable
      console.warn(`IMDB search API returned status ${response.status} for "${title}"`);
      throw new Error('IMDB search failed - API may have changed');
    }
    
    const data = await response.json();
    
    // Extract all matching IDs (as per requirements: keep all if multiple)
    // Note: This will add ALL matches found. For better accuracy, consider
    // filtering by type (movie vs TV) or year if available in CSV.
    const contentIds = [];
    if (data.d && Array.isArray(data.d)) {
      for (const item of data.d) {
        if (item.id) {
          contentIds.push({
            id: item.id,
            title: item.l || title,
            year: item.y || '',
            type: item.q || 'unknown'
          });
        }
      }
    }
    
    return contentIds;
  } catch (e) {
    console.error(`Error searching for "${title}":`, e);
    return [];
  }
}

async function addToIMDBList(contentId) {
  // Add a content ID to the current IMDB list
  try {
    // Get list ID from URL
    const listMatch = window.location.pathname.match(/\/list\/(ls\d+)/);
    if (!listMatch) {
      throw new Error('Could not determine list ID from URL');
    }
    const listId = listMatch[1];
    
    // Get CSRF token from page using multiple fallback selectors
    // Note: IMDB's CSRF field name (49e6c) is a hardcoded value that may change.
    // We try multiple methods to find it.
    let csrfToken = null;
    
    // Method 1: Try common IMDB CSRF field name
    const csrfInput = document.querySelector('input[name="49e6c"]');
    if (csrfInput) {
      csrfToken = csrfInput.value;
    }
    
    // Method 2: Try meta tag
    if (!csrfToken) {
      const csrfMeta = document.querySelector('meta[name="csrf-token"]');
      if (csrfMeta) csrfToken = csrfMeta.content;
    }
    
    // Method 3: Try cookie
    if (!csrfToken) {
      csrfToken = getCookie('csrftoken') || getCookie('csrf_token');
    }
    
    // Method 4: Try to find any input with "csrf" in the name
    if (!csrfToken) {
      const anyCSRF = document.querySelector('input[name*="csrf" i]');
      if (anyCSRF) csrfToken = anyCSRF.value;
    }
    
    if (!csrfToken) {
      console.warn('CSRF token not found using any method - request may fail');
    }
    
    // Make request to add item to list
    const formData = new FormData();
    formData.append('const', contentId);
    formData.append('list_id', listId);
    if (csrfToken) {
      formData.append('49e6c', csrfToken);
    }
    
    const response = await fetch('/list/_ajax/edit', {
      method: 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to add item to list');
    }
    
    return true;
  } catch (e) {
    console.error(`Error adding content ID ${contentId} to list:`, e);
    return false;
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function importTitlesToIMDB(titles) {
  const results = {
    total: titles.length,
    processed: 0,
    added: 0,
    failed: 0,
    errors: []
  };
  
  // Note: Per requirements, we keep ALL matching results for each title.
  // This means if a search returns multiple matches, all will be added to the list.
  // Users should be aware this may add duplicate or similar titles.
  
  for (const title of titles) {
    try {
      // Search for the title
      const contentIds = await searchIMDBTitle(title);
      
      if (contentIds.length === 0) {
        results.failed++;
        results.errors.push(`No results found for: ${title}`);
        console.warn(`No IMDB results for: ${title}`);
        continue;
      }
      
      // Log how many matches were found for transparency
      if (contentIds.length > 1) {
        console.log(`Found ${contentIds.length} matches for "${title}", adding all...`);
      }
      
      // Add all matching content IDs to the list (as per requirements)
      let addedAny = false;
      for (const content of contentIds) {
        const success = await addToIMDBList(content.id);
        if (success) {
          addedAny = true;
          results.added++;
          console.log(`Added: ${content.title} (${content.id})`);
        }
        
        // Reduced delay - only wait between items, not between all operations
        // If rate limiting becomes an issue, IMDB will return errors and we can increase
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!addedAny) {
        results.failed++;
        results.errors.push(`Failed to add: ${title}`);
      }
      
      results.processed++;
      
      // Slightly longer delay between different titles to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (e) {
      results.failed++;
      results.errors.push(`Error processing "${title}": ${e.message}`);
      console.error(`Error processing "${title}":`, e);
    }
  }
  
  return results;
}

// Constants for scroll behavior
const SCROLL_CHECK_INTERVAL = 250; // Time between scroll attempts (ms)
const SCROLL_WAIT_TIME = 200; // Time to wait after scroll for content to load (ms)
const MAX_SCROLL_ATTEMPTS = 100; // Maximum number of scroll attempts
const MAX_UNCHANGED_ATTEMPTS = 5; // Stop after this many attempts with no change
const FINAL_RENDER_DELAY = 250; // Final delay for pending renders (ms)

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
  } else if (request.action === 'importToIMDB') {
    // Handle IMDB import
    const importPromise = (async () => {
      try {
        const results = await importTitlesToIMDB(request.titles);
        return {
          success: true,
          addedCount: results.added,
          failedCount: results.failed,
          results: results
        };
      } catch (error) {
        return {
          success: false,
          error: true,
          message: error.message
        };
      }
    })();
    
    importPromise.then(result => {
      sendResponse(result);
    }).catch(error => {
      console.error('Error importing to IMDB:', error);
      sendResponse({
        success: false,
        error: true,
        message: error.message
      });
    });
    
    return true; // Keep message channel open for async response
  }
  return true;
});
