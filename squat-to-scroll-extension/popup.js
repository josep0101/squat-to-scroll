// Popup Script - Handles popup UI interactions

const DEFAULT_SITES = ['instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'x.com', 'reddit.com'];

document.addEventListener('DOMContentLoaded', async () => {
    // Tab navigation
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });

    // Elements
    const blockingToggle = document.getElementById('blockingToggle');
    const statusBadge = document.getElementById('statusBadge');
    const squatsTodayEl = document.getElementById('squatsToday');
    const sitesUnlockedEl = document.getElementById('sitesUnlocked');
    const blockedCountEl = document.getElementById('blockedCount');
    const squatsSettingEl = document.getElementById('squatsSetting');
    const openAppBtn = document.getElementById('openAppBtn');
    const sitesListEl = document.getElementById('sitesList');
    const newSiteInput = document.getElementById('newSiteInput');
    const addSiteBtn = document.getElementById('addSiteBtn');
    const resetSitesBtn = document.getElementById('resetSitesBtn');
    const squatsSlider = document.getElementById('squatsSlider');
    const squatsValueDisplay = document.getElementById('squatsValueDisplay');
    const openOnboardingBtn = document.getElementById('openOnboardingBtn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');

    // Load current state from storage
    const loadState = async () => {
        try {
            const result = await chrome.storage.local.get([
                'blockingEnabled',
                'squatsToday',
                'unlockedSites',
                'lastResetDate',
                'blockedSites',
                'squatsPerSession'
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

            // Update Home Tab UI
            const isEnabled = result.blockingEnabled !== false;
            blockingToggle.checked = isEnabled;
            updateStatusBadge(isEnabled);

            squatsTodayEl.textContent = result.squatsToday || 0;

            // Count currently unlocked sites
            const unlockedSites = result.unlockedSites || {};
            const now = Date.now();
            const activeUnlocks = Object.values(unlockedSites).filter(expiry => expiry > now).length;
            sitesUnlockedEl.textContent = activeUnlocks;

            // Get blocked sites
            const blockedSites = result.blockedSites || DEFAULT_SITES;
            blockedCountEl.textContent = blockedSites.length;
            renderSitesList(blockedSites);

            // Get squats setting
            const squats = result.squatsPerSession || 10;
            squatsSettingEl.textContent = squats;
            squatsSlider.value = squats;
            squatsValueDisplay.textContent = squats;

        } catch (e) {
            console.error('Error loading state:', e);
        }
    };

    // Update status badge
    const updateStatusBadge = (isEnabled) => {
        statusBadge.textContent = isEnabled ? 'Active' : 'Paused';
        statusBadge.className = 'status-badge ' + (isEnabled ? 'status-active' : 'status-inactive');
    };

    // Render sites list
    const renderSitesList = (sites) => {
        sitesListEl.innerHTML = '';
        sites.forEach(site => {
            const div = document.createElement('div');
            div.className = 'site-item';
            div.innerHTML = `
                <span>${site}</span>
                <button class="remove-btn" data-site="${site}">×</button>
            `;
            sitesListEl.appendChild(div);
        });

        // Add remove handlers
        sitesListEl.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const siteToRemove = btn.dataset.site;
                const result = await chrome.storage.local.get(['blockedSites']);
                const sites = (result.blockedSites || DEFAULT_SITES).filter(s => s !== siteToRemove);
                await chrome.storage.local.set({ blockedSites: sites });
                renderSitesList(sites);
                blockedCountEl.textContent = sites.length;
            });
        });
    };

    // Toggle blocking
    blockingToggle.addEventListener('change', async () => {
        const isEnabled = blockingToggle.checked;
        await chrome.storage.local.set({ blockingEnabled: isEnabled });
        updateStatusBadge(isEnabled);
    });

    // Open full app
    openAppBtn.addEventListener('click', async () => {
        const squats = await chrome.storage.local.get(['squatsPerSession']);
        const squatsNum = squats.squatsPerSession || 10;
        chrome.tabs.create({ url: `https://josep0101.github.io/squat-to-scroll/?squats=${squatsNum}` });
    });

    // Add site
    addSiteBtn.addEventListener('click', async () => {
        let site = newSiteInput.value.trim().toLowerCase();
        if (!site) return;

        // Normalize
        site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

        const result = await chrome.storage.local.get(['blockedSites']);
        const sites = result.blockedSites || DEFAULT_SITES;

        if (!sites.includes(site)) {
            sites.push(site);
            await chrome.storage.local.set({ blockedSites: sites });
            renderSitesList(sites);
            blockedCountEl.textContent = sites.length;
        }

        newSiteInput.value = '';
    });

    // Enter key for add site
    newSiteInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addSiteBtn.click();
        }
    });

    // Reset sites to defaults
    resetSitesBtn.addEventListener('click', async () => {
        await chrome.storage.local.set({ blockedSites: DEFAULT_SITES });
        renderSitesList(DEFAULT_SITES);
        blockedCountEl.textContent = DEFAULT_SITES.length;
    });

    // Squats slider
    squatsSlider.addEventListener('input', async () => {
        const value = parseInt(squatsSlider.value);
        squatsValueDisplay.textContent = value;
        squatsSettingEl.textContent = value;
        await chrome.storage.local.set({ squatsPerSession: value });
    });

    // Open onboarding
    openOnboardingBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    });

    // Reset stats
    resetStatsBtn.addEventListener('click', async () => {
        await chrome.storage.local.set({
            squatsToday: 0,
            unlockedSites: {}
        });
        squatsTodayEl.textContent = '0';
        sitesUnlockedEl.textContent = '0';
    });

    // Initial load
    await loadState();
});
