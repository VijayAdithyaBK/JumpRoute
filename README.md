# JumpRoute

> Click any link and it opens directly in your chosen Chrome profile — no right-click menus needed.

## How It Works

When **enabled**, JumpRoute intercepts every link click on any webpage and opens the URL in your target Chrome profile instead of navigating in the current one.

- **Toggle ON** → all clicked links open in the target profile
- **Toggle OFF** → normal browsing, links work as usual

Under the hood, a content script captures click events, and a native messaging host (Node.js) launches Chrome with the `--profile-directory` flag to open the link in the correct profile.

## Requirements

- **Google Chrome** (any recent version)
- **Node.js** v14+ ([download](https://nodejs.org/))

## Installation

### 1. Load the Extension

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `JumpRoute` folder.
4. Note the **Extension ID** shown on the card.

### 2. Register the Native Host

1. Double-click **`install.bat`**.
2. Paste your extension ID when prompted.
3. The script registers the native messaging host in the Windows Registry.

### 3. Verify & Configure

1. Click the **JumpRoute** toolbar icon.
2. Green dot = native host connected, profiles detected.
3. Select which profile links should open in.
4. Flip the **toggle ON** to activate.

## Usage

1. **Toggle ON** in the popup.
2. **Click any link** on any page — it opens in the selected profile.
3. **Toggle OFF** to return to normal browsing.

The extension badge shows **"ON"** when active.

## Uninstall

1. Run **`uninstall.bat`** to remove the registry entry.
2. Remove the extension from `chrome://extensions`.

## File Structure

```
JumpRoute/
├── manifest.json          # Chrome extension manifest (MV3)
├── background.js          # Service worker (native messaging relay + badge)
├── content.js             # Intercepts link clicks when enabled
├── popup.html             # Settings popup UI
├── popup.js               # Popup logic (toggle + profile selector)
├── popup.css              # Popup styling
├── icons/                 # Extension icons
├── native_host/
│   ├── host.js            # Node.js native messaging host
│   ├── host.bat           # Generated wrapper (created by install.bat)
│   └── com.jumproute.host.json  # Generated manifest (created by install.bat)
├── install.bat            # One-click installer
├── uninstall.bat          # One-click uninstaller
└── README.md
```
