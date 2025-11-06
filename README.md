# Watchlist Exporter Browser Extension

A cross-browser extension (Chrome, Firefox, Safari) that extracts and exports your saved TV shows and movies from popular streaming platforms to a CSV file.

## Supported Streaming Platforms

### Export Watchlists From:
- Netflix
- Prime Video (Amazon)
- Disney+
- Hulu
- Apple TV+
- Max
- Peacock
- Paramount+

### Import Watchlists To:
- IMDB Lists

## Features

- **One-Click Export**: Export your entire watchlist to a CSV file with a single click
- **CSV Import to IMDB**: Upload a CSV file with movie titles to automatically add them to your IMDB list
- **Smart Title Search**: Automatically searches IMDB for each title and finds matching content
- **Batch Import**: Add multiple movies/shows to your IMDB list at once
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

### Exporting Watchlists

1. Navigate to one of the supported streaming platforms (Netflix, Prime Video, Disney+, Hulu, Apple TV+, Max, Peacock, or Paramount+)
2. Go to your watchlist/My List page
3. Click the extension icon in your browser toolbar
4. Click "Export Watchlist" button
5. Choose where to save the CSV file

### Importing to IMDB Lists

1. Navigate to IMDB and go to any list page (or create a new list)
2. Click "Edit" to enter edit mode for the list
3. Click the extension icon in your browser toolbar
4. Upload your CSV file containing movie/show titles
5. Click "Import to IMDB List" button
6. The extension will:
   - Search IMDB for each title in your CSV
   - Find matching content IDs
   - Automatically add them to your current IMDB list

**CSV Format for Import**: Your CSV file should have either:
- A "Title" column with movie/show names
- Or a "Position" column followed by title names
- The extension will automatically detect the format

## Screenshots

The extension features an intuitive interface with helpful guidance:
- **Clickable platform links** when on unsupported sites - directs users to watchlist pages
- Clear navigation instructions when on the right platform but wrong page
- One-click export when on a watchlist page

See the [`screenshots/`](screenshots/) folder for detailed UI examples that can be used for publishing to browser extension stores.

## CSV Output Format

The exported CSV file includes the following columns:
- **Position**: Position number in the watchlist (1, 2, 3, ...)
- **Title**: Name of the movie or TV show

**Note**: When exporting from streaming platforms, the CSV uses a simple format with Position and Title columns, perfect for importing to IMDB or other services.

## Development

### File Structure
```
export-watchlist/
├── manifest.json       # Extension manifest
├── content.js         # Content script for extracting watchlist data
├── popup.html         # Extension popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup functionality (triggers extraction & downloads)
└── icons/             # Extension icons
```

### Permissions Required
- `activeTab`: Access to the current tab
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
