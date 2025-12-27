// Popup Script - Handles popup UI interactions

document.addEventListener('DOMContentLoaded', async () => {
    const blockingToggle = document.getElementById('blockingToggle');
    const statusBadge = document.getElementById('statusBadge');
    const squatsTodayEl = document.getElementById('squatsToday');
    const sitesUnlockedEl = document.getElementById('sitesUnlocked');
    const openAppBtn = document.getElementById('openAppBtn');

    // Load current state from storage
    const loadState = async () => {
        try {
            const result = await chrome.storage.local.get([
                'blockingEnabled',
                'squatsToday',
                'unlockedSites',
                'lastResetDate'
            ]);

            // Check if we need to reset daily stats
            const today = new Date().toDateString();
            if (result.lastResetDate !== today) {
                await chrome.storage.local.set({
                    squatsToday: 0,
                    lastResetDate: today
                });
                result.squatsToday = 0;
            }

            // Update UI
            const isEnabled = result.blockingEnabled !== false; // Default to true
            blockingToggle.checked = isEnabled;
            updateStatusBadge(isEnabled);

            squatsTodayEl.textContent = result.squatsToday || 0;

            // Count currently unlocked sites
            const unlockedSites = result.unlockedSites || {};
            const now = Date.now();
            const activeUnlocks = Object.values(unlockedSites).filter(expiry => expiry > now).length;
            sitesUnlockedEl.textContent = activeUnlocks;
        } catch (e) {
            console.error('Error loading state:', e);
        }
    };

    // Update status badge
    const updateStatusBadge = (isEnabled) => {
        statusBadge.textContent = isEnabled ? 'Active' : 'Paused';
        statusBadge.className = 'status-badge ' + (isEnabled ? 'status-active' : 'status-inactive');
    };

    // Toggle blocking
    blockingToggle.addEventListener('change', async () => {
        const isEnabled = blockingToggle.checked;
        await chrome.storage.local.set({ blockingEnabled: isEnabled });
        updateStatusBadge(isEnabled);
    });

    // Open full app
    openAppBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    });

    // Initial load
    await loadState();
});
