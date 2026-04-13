const NATIVE_HOST = 'com.profilelink.host';

// ── Initialise ──────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  // Set defaults
  chrome.storage.sync.get(
    { enabled: false, targetProfile: 'Default', targetProfileName: 'Default' },
    (data) => {
      chrome.storage.sync.set(data);
      updateBadge(data.enabled);
    }
  );
});

// On startup, sync badge state
chrome.storage.sync.get({ enabled: false }, (data) => {
  updateBadge(data.enabled);
});

// ── Badge ───────────────────────────────────────────────────────

function updateBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#34d399' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ── Listen for Storage Changes ──────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled !== undefined) {
    updateBadge(changes.enabled.newValue);
  }
});

// ── Message Handlers ────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'open-in-profile':
      openInProfile(msg.url, msg.profile);
      sendResponse({ ok: true });
      break;

    case 'detect-profiles':
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST,
        { action: 'list_profiles' },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          sendResponse(response);
        }
      );
      return true; // async

    default:
      break;
  }
});

// ── Native Messaging ────────────────────────────────────────────

function openInProfile(url, profileDirectory) {
  chrome.runtime.sendNativeMessage(
    NATIVE_HOST,
    { action: 'open', url, profile: profileDirectory },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('[JumpRoute] Native host error:', chrome.runtime.lastError.message);
      } else if (response && !response.success) {
        console.error('[JumpRoute] Host error:', response.error);
      }
    }
  );
}
