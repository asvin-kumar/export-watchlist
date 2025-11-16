# Copilot Instructions for Watchlist Exporter

## Project Overview
This is a cross-browser extension (Chrome, Firefox, Safari) that extracts and exports watchlists from popular streaming platforms to CSV files. The extension runs locally in the browser, respecting user privacy by not collecting or transmitting any data.

## Technology Stack
- **Platform**: Browser Extension (Manifest V3)
- **Languages**: JavaScript (vanilla, no frameworks)
- **Supported Browsers**: Chrome 88+, Edge 88+, Firefox 109+, Safari 16.4+
- **Streaming Platforms**: Netflix, Prime Video, Disney+, Hulu

## Project Structure
```
export-watchlist/
├── manifest.json       # Extension manifest (Manifest V3)
├── content.js         # Content script for extracting watchlist data
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup functionality
├── icons/             # Extension icons (active/inactive states)
├── README.md          # User documentation
└── INSTALLATION.md    # Installation and testing guide
```

## Coding Standards

### JavaScript Style
- Use vanilla JavaScript (ES6+) - no external frameworks or libraries
- Use `const` and `let` instead of `var`
- Use arrow functions for callbacks and anonymous functions
- Use template literals for string concatenation
- Use try-catch blocks for error handling
- Log errors to console with descriptive messages

### Browser Extension Patterns
- Use `chrome.*` APIs (compatible with most browsers via polyfill)
- Always handle async operations with async/await or promises
- Use `chrome.runtime.sendMessage` for communication between components
- Return `true` from message listeners when using async responses
- Check for `chrome.runtime.lastError` after API calls

### Code Organization
- Keep functions focused and single-purpose
- Use descriptive function and variable names
- Group related functionality together
- Add comments for complex logic or platform-specific quirks

## Key Components


### content.js (Content Script)
- Runs on streaming platform pages
- Extracts watchlist data using DOM selectors
- Each platform has its own extraction function
- Returns data in standardized format: `{ title, type, platform, imageUrl, extractedDate }`

### popup.js (Extension Popup)
- Checks if current site is supported
- Triggers watchlist extraction
- Converts data to CSV
- Initiates download

## Adding Support for New Streaming Platforms

To add a new platform, update these files in order:

1. **manifest.json**:
  - Add URL to `host_permissions`
  - Add URL to `content_scripts.matches`

2. **content.js**:
  - Create new extraction function `extractPlatformNameWatchlist()`
  - Add condition in message listener to call the function
  - Use platform-specific DOM selectors
  - Handle duplicates with `Set`

3. **README.md** and **INSTALLATION.md**:
  - Update supported platforms list

## CSV Format
All extracted data must follow this structure:
```javascript
{
  title: string,        // Movie/show name
  type: string,         // "Movie/Show"
  platform: string,     // Platform name (e.g., "Netflix")
  imageUrl: string,     // Thumbnail URL
  extractedDate: string // ISO date format (YYYY-MM-DD)
}
```

CSV escaping rules:
- Escape double quotes by doubling them (`"` → `""`)
- Wrap values in quotes if they contain commas, quotes, or newlines
- Headers match object keys

## Common Patterns

### Checking Supported Sites
```javascript
const STREAMING_SITES = ['netflix.com', 'primevideo.com', ...];
function isStreamingSite(url) {
  const hostname = new URL(url).hostname;
  return STREAMING_SITES.some(site => 
    hostname === `www.${site}` || hostname.endsWith(`.${site}`)
  );
}
```

### Message Passing
```javascript
// Sender
chrome.runtime.sendMessage({ action: 'actionName', data: value });

// Receiver
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'actionName') {
    // Handle action
    sendResponse({ result: 'success' });
  }
  return true; // Important for async responses
});
```

### DOM Extraction Pattern
```javascript
function extractPlatformWatchlist() {
  const items = [];
  const seenTitles = new Set(); // Prevent duplicates
  
  const cards = document.querySelectorAll('selector');
  cards.forEach(card => {
    try {
      const title = card.querySelector('.title')?.textContent.trim();
      if (title && !seenTitles.has(title)) {
        seenTitles.add(title);
        items.push({ title, type: 'Movie/Show', ... });
      }
    } catch (e) {
      console.error('Error extracting item:', e);
    }
  });
  return items;
}
```

## Privacy & Security Requirements

### Privacy
- ✅ NO data collection
- ✅ NO external API calls
- ✅ NO data transmission
- ✅ All processing happens locally
- ✅ NO storage of user data

### Security
- Validate and sanitize all extracted data
- Use try-catch blocks to prevent crashes
- Escape CSV data properly to prevent injection
- Only run on specified domains (use `host_permissions`)
- Don't expose sensitive information in console logs

## Testing

### Manual Testing Checklist
1. **Icon States**: Icon should be active on supported sites, inactive elsewhere
2. **Popup UI**: Show correct content based on site support
3. **Extraction**: Extract data from watchlist pages
4. **CSV Export**: Download properly formatted CSV

### Testing on Different Platforms
Test on all supported streaming platforms:
- Navigate to watchlist/My List page
- Click extension icon or use context menu
- Verify CSV contains correct data
- Check for duplicates and missing items

### Browser Compatibility
Test on:
- Chrome/Edge (primary)
- Firefox (use `about:debugging`)
- Safari (requires conversion for production)

## Common Issues & Solutions

### Selectors Not Working
Streaming sites frequently update their HTML structure. If extraction fails:
1. Inspect the watchlist page DOM
2. Update selectors in the platform's extraction function
3. Test on multiple pages to ensure reliability
4. Add fallback selectors when possible

### Extension Icon Not Updating
- Ensure tab URL is checked correctly in `isStreamingSite()`
- Check that `updateIcon()` is called on tab activation/update
- Verify icon files exist in `/icons` directory

### No Items Extracted
- User must be on the actual watchlist page
- Selectors may need updating
- Check browser console for errors
- Verify content script is injected (`chrome.tabs.sendMessage` succeeds)

## File Naming Conventions
- Use kebab-case for files: `background.js`, `content.js`
- Icon files: `icon-[state]-[size].png` (e.g., `icon-active-16.png`)
- CSV exports: `watchlist-YYYY-MM-DD.csv`

## Dependencies
- ✅ **NO external dependencies** - keep extension lightweight
- ✅ **NO npm packages** - vanilla JavaScript only
- ✅ **NO bundler required** - files loaded directly

## Browser API Usage

### Required Permissions
- `activeTab`: Access current tab
- `downloads`: Download CSV files
- `scripting`: Execute content scripts

### Chrome APIs Used
- `chrome.runtime.*`: Messaging and lifecycle
- `chrome.tabs.*`: Tab information and management
- `chrome.action.*`: Extension icon control
- `chrome.downloads.*`: File downloads

## Development Workflow

### Making Changes
1. Edit source files
2. Reload extension in browser (`chrome://extensions` → Reload)
3. Test on actual streaming sites
4. Verify CSV output format
5. Test across different browsers if possible

### Debugging
- Use browser DevTools console
- Inspect popup with right-click → Inspect
- Check content script console on streaming pages

## Important Notes

### Manifest V3 Specifics
- Background scripts are service workers (no DOM access)
- Service workers can be terminated - don't rely on persistent state
- Use `chrome.action` instead of `chrome.browserAction`

### DOM Extraction Challenges
- Streaming sites use dynamic class names
- Content may load asynchronously
- Selectors break frequently with site updates
- Always have fallback extraction methods

### Cross-Browser Compatibility
- Use `chrome.*` APIs (Firefox polyfills automatically)
- Test on Firefox using temporary add-ons
- Safari may need additional adaptations
- `browser_specific_settings` in manifest for Firefox ID

## When to Update Documentation
Update README.md and INSTALLATION.md when:
- Adding new streaming platform support
- Changing user-facing features
- Modifying installation steps
- Adding new browser compatibility

## Code Review Guidelines
Before submitting changes, ensure:
- ✅ Code follows existing style and patterns
- ✅ No external dependencies added
- ✅ Privacy requirements maintained (no data collection)
- ✅ CSV format remains consistent
- ✅ Error handling is present
- ✅ Code works on at least one streaming platform
- ✅ Extension icon states work correctly
- ✅ No console errors in normal operation
