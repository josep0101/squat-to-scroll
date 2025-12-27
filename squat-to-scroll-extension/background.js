// Background Service Worker
// Handles navigation interception and timer checks

// ===========================================
// CONFIGURATION
// ===========================================
const SQUAT_APP_URL = "https://josep0101.github.io/squat-to-scroll/";

// Default blocked sites (can be overridden by user settings)
const DEFAULT_BLOCKED_SITES = [
  "instagram.com",
  "tiktok.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "reddit.com"
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Get blocked sites from storage or use defaults
async function getBlockedSites() {
  try {
    const result = await chrome.storage.local.get(['blockedSites']);
    return result.blockedSites || DEFAULT_BLOCKED_SITES;
  } catch (e) {
    return DEFAULT_BLOCKED_SITES;
  }
}

// Get squats per session from storage or use default
async function getSquatsPerSession() {
  try {
    const result = await chrome.storage.local.get(['squatsPerSession']);
    return result.squatsPerSession || 10;
  } catch (e) {
    return 10;
  }
}

// Check if a URL matches our blocked list
async function isBlockedUrl(url) {
  const blockedSites = await getBlockedSites();
  try {
    const hostname = new URL(url).hostname;
    return blockedSites.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// ===========================================
// NAVIGATION INTERCEPTION
// ===========================================

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigation (not iframes)
  if (details.frameId !== 0) return;

  const url = details.url;

  if (await isBlockedUrl(url)) {
    // Check if blocking is enabled
    const settings = await chrome.storage.local.get(['blockingEnabled']);
    const blockingEnabled = settings.blockingEnabled !== false; // Default true

    if (!blockingEnabled) return; // Skip if disabled

    const targetDomain = new URL(url).hostname;

    // Check storage for access token
    const result = await chrome.storage.local.get(['unlockedSites']);
    const unlockedSites = result.unlockedSites || {};

    const expiryTime = unlockedSites[targetDomain];
    const now = Date.now();

    // If no access or access expired
    if (!expiryTime || now > expiryTime) {
      // Get squats setting
      const squats = await getSquatsPerSession();

      // Redirect to the GitHub Pages hosted app
      // Pass target URL and squats as query parameters
      const appUrl = SQUAT_APP_URL + `?target=${encodeURIComponent(url)}&squats=${squats}`;

      chrome.tabs.update(details.tabId, { url: appUrl });
    }
  }
});

// ===========================================
// MESSAGE LISTENER (for unlock requests from app)
// ===========================================

chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
  console.log('[Background] Received external message:', message);

  if (message.type === 'UNLOCK_SITE') {
    const { domain, duration, targetUrl } = message;

    try {
      // Get current unlocks
      const result = await chrome.storage.local.get(['unlockedSites', 'squatsToday']);
      const currentUnlocks = result.unlockedSites || {};
      const squatsToday = (result.squatsToday || 0) + (message.squats || 10);

      // Calculate expiry
      const expiry = Date.now() + (duration * 60 * 1000);

      // Save unlock
      await chrome.storage.local.set({
        unlockedSites: {
          ...currentUnlocks,
          [domain]: expiry
        },
        squatsToday: squatsToday
      });

      console.log('[Background] Site unlocked:', domain, 'until:', new Date(expiry));

      // Redirect to target URL
      if (targetUrl && sender.tab) {
        chrome.tabs.update(sender.tab.id, { url: targetUrl });
      }

      sendResponse({ success: true });
    } catch (e) {
      console.error('[Background] Error unlocking site:', e);
      sendResponse({ success: false, error: e.message });
    }
  }

  return true; // Keep channel open for async response
});

// ===========================================
// INSTALLATION HANDLER
// ===========================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[Squat to Scroll] Extension installed/updated", details.reason);

  if (details.reason === 'install') {
    // First install - open onboarding
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });

    // Set default values
    chrome.storage.local.set({
      blockedSites: DEFAULT_BLOCKED_SITES,
      squatsPerSession: 10,
      blockingEnabled: true,
      squatsToday: 0,
      lastResetDate: new Date().toDateString()
    });
  }
});