# Watchlist Exporter Browser Extension

A cross-browser extension (Chrome, Firefox, Safari) that extracts and exports your saved TV shows and movies from popular streaming platforms to a CSV file.

## Supported Streaming Platforms

- Netflix
- Prime Video (Amazon)
- Disney+
- Hulu
- Apple TV+
- Max
- Peacock
- Paramount+

## Features

- **One-Click Export**: Export your entire watchlist to a CSV file with a single click
- **Context Menu**: Right-click option to export watchlist
- **Smart Icon States**: Extension icon lights up on supported streaming sites and grays out on unsupported sites
- **Cross-Browser Compatible**: Works on Chrome, Firefox, and Safari
- **CSV Format**: Easy to import into spreadsheets or other services

## Installation

### Chrome
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension is now installed!

### Firefox
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the extension directory
5. The extension is now installed!

### Safari
1. Download or clone this repository
2. Open Safari and enable "Develop" menu in Preferences > Advanced
3. Go to Develop > Show Extension Builder
4. Click "+" and add the extension directory
5. Build and install the extension

## How to Use

1. Navigate to one of the supported streaming platforms (Netflix, Prime Video, Disney+, Hulu, Apple TV+, Max, Peacock, or Paramount+)
2. Go to your watchlist/My List page
3. Click the extension icon in your browser toolbar
4. Click "Export Watchlist" button
5. Choose where to save the CSV file

### Alternative: Context Menu
- Right-click anywhere on a supported streaming site
- Select "Export Watchlist to CSV" from the context menu

## Screenshots

The extension features an intuitive interface with helpful guidance:
- **Clickable platform links** when on unsupported sites - directs users to watchlist pages
- Clear navigation instructions when on the right platform but wrong page
- One-click export when on a watchlist page

See the [`screenshots/`](screenshots/) folder for detailed UI examples that can be used for publishing to browser extension stores.

## CSV Output Format

The exported CSV file includes the following columns:
- **title**: Name of the movie or TV show
- **type**: Type of content (Movie/Show)
- **platform**: Streaming platform name
- **imageUrl**: URL to the content's thumbnail image
- **extractedDate**: Date when the data was extracted

## Development

### File Structure
```
export-watchlist/
├── manifest.json       # Extension manifest
├── background.js       # Service worker for context menu and icon management
├── content.js         # Content script for extracting watchlist data
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup functionality
└── icons/             # Extension icons (active/inactive states)
```

### Permissions Required
- `activeTab`: Access to the current tab
- `contextMenus`: Add context menu options
- `downloads`: Download CSV files
- `scripting`: Execute scripts on streaming sites

## Privacy

This extension:
- Only runs on specified streaming websites
- Does not collect or transmit any data
- All processing happens locally in your browser
- No external servers are contacted
- No personal information is stored

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use and modify as needed.

## Support

If you encounter any issues or have suggestions, please open an issue on GitHub.
