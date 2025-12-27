// Content Script for GitHub Pages
// This runs on the Squat to Scroll app hosted on GitHub Pages
// It enables communication between the web app and the extension

console.log('[SquatToScroll Content] Loaded on:', window.location.href);

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
    // Only accept messages from our app origin
    if (!event.origin.includes('josep0101.github.io') && !event.origin.includes('localhost')) {
        return;
    }

    const data = event.data;

    if (data.type === 'SQUAT_UNLOCK_REQUEST') {
        console.log('[SquatToScroll Content] Unlock request received:', data);

        try {
            // Get current data from extension storage
            const result = await chrome.storage.local.get(['unlockedSites', 'squatsToday']);
            const currentUnlocks = result.unlockedSites || {};
            const squatsToday = (result.squatsToday || 0) + (data.squats || 10);

            // Calculate expiry time (duration in minutes)
            const durationMs = (data.duration || 5) * 60 * 1000;
            const expiry = Date.now() + durationMs;

            // Normalize domain - remove www. and get base domain
            let domain = data.domain;
            if (domain) {
                domain = domain.replace('www.', '');
            }

            // Save to extension storage
            await chrome.storage.local.set({
                unlockedSites: {
                    ...currentUnlocks,
                    [domain]: expiry
                },
                squatsToday
            });

            console.log('[SquatToScroll Content] Unlock saved for:', domain, 'until', new Date(expiry).toLocaleTimeString());

            // Notify the page that unlock was successful
            window.postMessage({
                type: 'SQUAT_UNLOCK_SUCCESS',
                domain: domain,
                expiry: expiry
            }, '*');

            // Small delay to ensure storage is written before redirect
            await new Promise(resolve => setTimeout(resolve, 100));

            // Redirect to the target URL
            if (data.targetUrl) {
                console.log('[SquatToScroll Content] Redirecting to:', data.targetUrl);
                window.location.href = data.targetUrl;
            }
        } catch (e) {
            console.error('[SquatToScroll Content] Error:', e);
            window.postMessage({
                type: 'SQUAT_UNLOCK_ERROR',
                error: e.message
            }, '*');
        }
    }
});

// Notify page that content script is ready
setTimeout(() => {
    window.postMessage({ type: 'SQUAT_EXTENSION_READY' }, '*');
    console.log('[SquatToScroll Content] Ready signal sent');
}, 100);
