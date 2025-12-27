// Content Script for GitHub Pages
// This runs on the Squat to Scroll app hosted on GitHub Pages
// It enables communication between the web app and the extension

console.log('[SquatToScroll Content] Loaded on:', window.location.href);

// Listen for messages from the web page
window.addEventListener('message', async (event) => {
    // Only accept messages from our app
    if (event.origin !== 'https://josep0101.github.io') return;

    const data = event.data;

    if (data.type === 'SQUAT_UNLOCK_REQUEST') {
        console.log('[SquatToScroll Content] Unlock request received:', data);

        try {
            // Get current data from extension storage
            const result = await chrome.storage.local.get(['unlockedSites', 'squatsToday']);
            const currentUnlocks = result.unlockedSites || {};
            const squatsToday = (result.squatsToday || 0) + (data.squats || 10);

            // Calculate expiry time
            const expiry = Date.now() + (data.duration * 60 * 1000);

            // Save to extension storage
            await chrome.storage.local.set({
                unlockedSites: {
                    ...currentUnlocks,
                    [data.domain]: expiry
                },
                squatsToday
            });

            console.log('[SquatToScroll Content] Unlock saved:', data.domain, 'until', new Date(expiry));

            // Notify the page that unlock was successful
            window.postMessage({ type: 'SQUAT_UNLOCK_SUCCESS', domain: data.domain }, '*');

            // Redirect to the target URL
            if (data.targetUrl) {
                console.log('[SquatToScroll Content] Redirecting to:', data.targetUrl);
                window.location.href = data.targetUrl;
            }
        } catch (e) {
            console.error('[SquatToScroll Content] Error:', e);
            window.postMessage({ type: 'SQUAT_UNLOCK_ERROR', error: e.message }, '*');
        }
    }
});

// Notify page that content script is ready
window.postMessage({ type: 'SQUAT_EXTENSION_READY' }, '*');
