# Installation and Testing Guide

## Quick Start

### For Chrome/Edge
1. Clone or download this repository
2. Open Chrome/Edge and go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select the extension directory
6. The extension should now appear in your extensions list

### For Firefox
1. Clone or download this repository
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Navigate to the extension directory and select `manifest.json`
5. The extension is now loaded (note: temporary extensions are removed when Firefox restarts)

## Testing the Extension

### Test 1: Icon State Changes
1. Install the extension
2. Open a random website (e.g., google.com)
   - ✓ The extension icon should be grayed out
3. Navigate to netflix.com (or any supported streaming site)
   - ✓ The extension icon should light up (blue color)

### Test 2: Popup UI
1. While on an unsupported site (e.g., google.com):
   - Click the extension icon
   - ✓ You should see a message listing supported streaming sites with clickable hyperlinks
   - ✓ Click any platform link to navigate directly to its watchlist page
2. While on a supported site but not on watchlist page (e.g., netflix.com home):
   - Click the extension icon
   - ✓ You should see a message to navigate to the watchlist page with a clickable link
3. While on a watchlist page:
   - Click the extension icon
   - ✓ You should see an "Export Watchlist" button

### Test 3: Watchlist Export
1. Go to your Netflix My List page (or equivalent on other platforms)
2. Click the extension icon
3. Click "Export Watchlist"
4. ✓ A CSV file should download containing your watchlist items

### Test 4: Context Menu
1. Navigate to a supported streaming site
2. Right-click anywhere on the page
3. ✓ You should see "Export Watchlist to CSV" in the context menu
4. Click it
5. ✓ The watchlist should export to CSV

## Supported Streaming Platforms

- **Netflix**: www.netflix.com
- **Prime Video**: www.primevideo.com, www.amazon.com
- **Disney+**: www.disneyplus.com
- **Hulu**: www.hulu.com
- **Apple TV+**: tv.apple.com
- **Max**: play.max.com
- **Peacock**: www.peacocktv.com
- **Paramount+**: www.paramountplus.com

## Expected CSV Output

The CSV file will have the following columns:
```
title,type,platform,imageUrl,extractedDate
"Stranger Things","Movie/Show","Netflix","https://...","2025-11-05"
"The Crown","Movie/Show","Netflix","https://...","2025-11-05"
```

## Troubleshooting

### Extension icon not changing
- Make sure you're on the actual streaming site (not a subdomain)
- Refresh the page after installing the extension
- Check browser console for any errors

### No items extracted
- Make sure you're on the watchlist/My List page
- Some streaming sites may have changed their HTML structure
- Check the browser console for errors

### Context menu not appearing
- Make sure you're on a supported streaming site
- Try refreshing the page
- Check that the extension has the necessary permissions

## Development Notes

### File Structure
- `manifest.json` - Extension configuration
- `background.js` - Service worker (handles icon states and context menu)
- `content.js` - Runs on streaming sites (extracts data)
- `popup.html/css/js` - Extension popup interface
- `icons/` - Extension icons (active and inactive states)

### Adding Support for New Streaming Sites
To add support for a new streaming platform:

1. Update `manifest.json`:
   - Add URL pattern to `host_permissions`
   - Add URL pattern to `content_scripts.matches`

2. Update `background.js`:
   - Add site to `STREAMING_SITES` array

3. Update `content.js` and `popup.js`:
   - Add extraction function for the new site

### Browser Compatibility

The extension uses Manifest V3, which is supported by:
- Chrome 88+
- Edge 88+
- Firefox 109+
- Safari 16.4+ (with some adaptations)

## Privacy & Security

This extension:
- Only runs on specified streaming websites
- Does not collect or send any data to external servers
- All processing happens locally in your browser
- Does not store any personal information
- Open source - you can review all code

## License

MIT License - Free to use and modify
