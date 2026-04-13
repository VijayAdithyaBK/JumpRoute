/**
 * JumpRoute – Content Script
 *
 * When enabled, intercepts link clicks and sends them to the
 * target Chrome profile via native messaging.
 *
 * Uses a debounce + URL dedup guard to prevent the same
 * link from firing multiple times (bubbling, iframes, etc.)
 */

(function () {
  'use strict';

  let isEnabled = false;
  let targetProfile = 'Default';

  // Track the last URL+time to deduplicate rapid duplicate events
  let lastSentUrl = '';
  let lastSentAt = 0;
  const DEDUP_MS = 500;

  // ── Load State ──────────────────────────────────────────────────

  chrome.storage.sync.get({ enabled: false, targetProfile: 'Default' }, (data) => {
    isEnabled = data.enabled;
    targetProfile = data.targetProfile;
  });

  // ── React to Setting Changes in Real-Time ─────────────────────

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.enabled !== undefined) isEnabled = changes.enabled.newValue;
    if (changes.targetProfile) targetProfile = changes.targetProfile.newValue;
  });

  // ── Intercept Link Clicks ─────────────────────────────────────

  document.addEventListener(
    'click',
    (e) => {
      if (!isEnabled) return;

      // Only plain left-clicks (no Ctrl/Shift/Meta/middle)
      if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) return;

      // Walk up DOM to find the nearest <a href>
      const anchor = e.composedPath
        ? e.composedPath().find((el) => el instanceof HTMLAnchorElement && el.href)
        : e.target.closest('a[href]');

      if (!anchor) return;

      const href = anchor.href;

      // Skip non-navigating links
      if (!href || href.startsWith('javascript:') || href.startsWith('blob:')) return;

      // Skip same-page hash navigation
      try {
        const linkUrl = new URL(href, window.location.href);

        // Only redirect http/https URLs
        if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') return;

        // Skip if it's only a hash change on the same page
        if (
          linkUrl.origin === window.location.origin &&
          linkUrl.pathname === window.location.pathname &&
          linkUrl.hash &&
          !linkUrl.search
        ) {
          return;
        }

        // Deduplicate: skip if same URL was sent very recently
        const now = Date.now();
        if (href === lastSentUrl && now - lastSentAt < DEDUP_MS) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }

        lastSentUrl = href;
        lastSentAt = now;

      } catch (_) {
        return; // malformed URL – let browser handle it
      }

      // Block the default navigation
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Send to background → native host → open in target profile
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            type: 'open-in-profile',
            url: href,
            profile: targetProfile
          });
        } else {
          console.warn('[JumpRoute] Extension context invalidated. Please refresh the page.');
          // Fallback to default navigation if extension is broken
          window.location.href = href;
        }
      } catch (err) {
        console.warn('[JumpRoute] Error sending message (context likely invalidated):', err.message);
        window.location.href = href;
      }
    },
    true // capture phase – fires before page-level handlers
  );
})();
