#!/usr/bin/env node

/**
 * ProfileLink – Native Messaging Host
 *
 * Handles two actions:
 *   1. "open"          – Opens a URL in the specified Chrome profile.
 *   2. "list_profiles" – Enumerates all Chrome profiles on this machine.
 *
 * Communication uses Chrome's native-messaging protocol:
 *   stdin  → 4-byte LE length prefix + JSON message
 *   stdout ← 4-byte LE length prefix + JSON response
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Native Messaging I/O ────────────────────────────────────────

let inputBuffer = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  processInput();
});

function processInput() {
  // Need at least 4 bytes for the length prefix
  while (inputBuffer.length >= 4) {
    const msgLen = inputBuffer.readUInt32LE(0);

    // Wait until the entire message has arrived
    if (inputBuffer.length < 4 + msgLen) break;

    const msgBody = inputBuffer.slice(4, 4 + msgLen).toString('utf8');
    inputBuffer = inputBuffer.slice(4 + msgLen);

    try {
      const message = JSON.parse(msgBody);
      handleMessage(message);
    } catch (err) {
      sendResponse({ success: false, error: 'Invalid JSON: ' + err.message });
    }
  }
}

function sendResponse(obj) {
  const json = Buffer.from(JSON.stringify(obj), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(json.length, 0);
  process.stdout.write(header);
  process.stdout.write(json);
}

// ── Message Handler ─────────────────────────────────────────────

function handleMessage(msg) {
  switch (msg.action) {
    case 'open':
      return handleOpen(msg);
    case 'list_profiles':
      return handleListProfiles();
    default:
      sendResponse({ success: false, error: `Unknown action: ${msg.action}` });
  }
}

// ── Open URL in Profile ─────────────────────────────────────────

function handleOpen(msg) {
  const url = msg.url || '';
  const profile = msg.profile || 'Default';

  if (!url) {
    return sendResponse({ success: false, error: 'No URL provided' });
  }

  // Find Chrome executable
  const chromePaths = [
    path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  let chromeExe = null;
  for (const p of chromePaths) {
    if (fs.existsSync(p)) {
      chromeExe = p;
      break;
    }
  }

  if (!chromeExe) {
    return sendResponse({ success: false, error: 'Chrome executable not found' });
  }

  // Spawn Chrome directly (NOT via cmd.exe start) so it launches as an
  // independent process. This forces Chrome to honour --profile-directory
  // even when another Chrome window is already open.
  try {
    const child = spawn(
      chromeExe,
      ['--profile-directory=' + profile, url],
      { detached: true, stdio: 'ignore' }
    );
    child.unref(); // let this process exit independently of node
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// ── List Chrome Profiles ────────────────────────────────────────

function handleListProfiles() {
  const userDataDir = path.join(
    process.env.LOCALAPPDATA || '',
    'Google',
    'Chrome',
    'User Data'
  );

  let entries;
  try {
    entries = fs.readdirSync(userDataDir, { withFileTypes: true });
  } catch (err) {
    return sendResponse({ success: false, error: 'Cannot read Chrome User Data: ' + err.message });
  }

  // Directories to always skip
  const SKIP_DIRS = new Set(['System Profile', 'Guest Profile', 'System Profile Delivery']);

  const profiles = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const prefsPath = path.join(userDataDir, entry.name, 'Preferences');
    try {
      const raw = fs.readFileSync(prefsPath, 'utf8');
      const prefs = JSON.parse(raw);

      // Priority: Google account full name → profile.name → directory name
      const accountName =
        (Array.isArray(prefs.account_info) && prefs.account_info.length > 0)
          ? prefs.account_info[0].full_name || prefs.account_info[0].email || ''
          : '';

      const profileName = prefs.profile?.name || '';

      // Use account name if it's meaningful; fall back to profile name or dir name
      let displayName = accountName || profileName || entry.name;

      // Skip placeholder names like "Person N" if we have nothing better
      if (/^Person\s+\d+$/i.test(displayName) && !accountName) {
        displayName = entry.name; // show directory name instead (e.g. "Default", "Profile 1")
      }

      profiles.push({
        directory: entry.name,
        name: displayName
      });
    } catch (_) {
      // Not a real profile directory – skip silently
    }
  }

  // If multiple profiles share the same display name, disambiguate with directory
  const nameCounts = {};
  profiles.forEach((p) => {
    nameCounts[p.name] = (nameCounts[p.name] || 0) + 1;
  });
  profiles.forEach((p) => {
    if (nameCounts[p.name] > 1) {
      p.name = `${p.name} (${p.directory})`;
    }
  });

  // Sort: Default first, then alphabetical by display name
  profiles.sort((a, b) => {
    if (a.directory === 'Default') return -1;
    if (b.directory === 'Default') return 1;
    return a.name.localeCompare(b.name);
  });

  sendResponse({ success: true, profiles });
}
