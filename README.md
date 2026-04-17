# JumpRoute

> Click any link and it opens directly in your chosen Chrome profile — zero right-clicks, zero friction.

JumpRoute is a productivity-focused Chrome extension that redirects link clicks across different browser profiles. Whether you're separating work from personal browsing or managing multiple client accounts, JumpRoute ensures every click ends up in the right window automatically.

## 🚀 Key Features

- **Zero-Click Redirection**: Simply click a link, and it opens in your target profile.
- **Smart Toggle**: Flip the switch in the popup to enable/disable interception instantly.
- **Auto-Discovery**: Automatically detects all your available Chrome profiles on launch.
- **Native Integration**: Uses the official Chrome Native Messaging API for reliable, sub-second profile switching.

## 🛠️ Tech Stack

- **Extension**: Manifest V3, Service Workers, Content Scripts.
- **Native Host**: Node.js (Runtime), Windows Shell integration.
- **Registry**: Windows RegEdit (for host registration).
- **Communication**: Chrome Native Messaging (JSON-based stdio).

## 🏗️ How It Works (Architecture)

1. **Interception**: When enabled, a **Content Script** listens for click events on the webpage.
2. **Relay**: The script stops the default navigation and sends the URL to the **Background Service Worker**.
3. **Execution**: The Service Worker establishes a channel with the **Native Host (Node.js)** via Native Messaging.
4. **Launch**: The Node.js host executes a raw Chrome command with the `--profile-directory` flag to open the link in the correct window.

## 📋 Requirements

- **Google Chrome** (any recent version)
- **Node.js** v14+ ([download](https://nodejs.org/))
- **OS**: Windows (Native Messaging registry keys are Windows-specific in this version)

## 📦 Installation

### 1. Load the Extension
1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `JumpRoute` folder.
4. Note the **Extension ID** shown on the card.

### 2. Register the Native Host
1. Double-click **`install.bat`**.
2. Paste your extension ID when prompted.
3. This registers the host in the Windows Registry so Chrome can communicate with it.

### 3. Verify & Configure
1. Click the **JumpRoute** toolbar icon.
2. **Green dot** = Connection active.
3. Select which profile links should open in.
4. Flip the **toggle ON** to activate.

## 📖 Usage

1. **Toggle ON** in the popup.
2. **Click any link** on any page — it opens in the selected profile.
3. **Toggle OFF** to return to normal browsing.
4. The extension badge shows **"ON"** when active.

## 🗑️ Uninstall

1. Run **`uninstall.bat`** to remove the registry entry.
2. Remove the extension from `chrome://extensions`.

## 📂 File Structure

```
JumpRoute/
├── manifest.json          # Extension config (MV3)
├── background.js          # Service worker (messaging relay)
├── content.js             # Event listener for link clicks
├── popup/                 # Settings UI (HTML, CSS, JS)
├── icons/                 # Extension assets
├── native_host/
│   ├── host.js            # Node.js communication logic
│   ├── host.bat           # Generated wrapper for Chrome
│   └── com.jumproute.host.json  # Host manifest (installer generated)
├── install.bat            # One-click Windows setup
└── uninstall.bat          # Registry cleanup
```

## 💡 Why This Exists?

Browsing with multiple Chrome profiles is powerful but often leads to "copy-paste fatigue" when links from your personal email need to open in a work environment (or vice-versa). JumpRoute was built to solve this by making profile switching a first-class citizen of the browsing experience. 

It serves as a technical demonstration of **cross-process communication** between a sandboxed browser environment and the native operating system.

