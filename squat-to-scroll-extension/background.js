// Background Service Worker
// Handles navigation interception and timer checks

// ===========================================
// CONFIGURATION - Update these values!
// ===========================================
// After deploying to GitHub Pages, update this URL:
// Format: https://<your-username>.github.io/<repo-name>/
const SQUAT_APP_URL = "https://josep0101.github.io/squat-to-scroll/";
// ===========================================

// List of distracting websites to block
const BLOCKED_DOMAINS = [
  "instagram.com",
  "tiktok.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "reddit.com"
];

// Check if a URL matches our blocked list
function isBlockedUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Intercept Navigation
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main frame navigation (not iframes)
  if (details.frameId !== 0) return;

  const url = details.url;

  if (isBlockedUrl(url)) {
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
      // Redirect to the GitHub Pages hosted app
      // We pass the target URL as a query parameter so the app knows what to unlock
      const appUrl = SQUAT_APP_URL + `?target=${encodeURIComponent(url)}`;

      chrome.tabs.update(details.tabId, { url: appUrl });
    }
  }
}, {
  url: BLOCKED_DOMAINS.map(d => ({ hostContains: d }))
});

// Listener for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Squat to Scroll installed. Get moving!");
});