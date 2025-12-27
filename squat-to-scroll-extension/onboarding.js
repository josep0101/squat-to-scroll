// Onboarding Script - CSP Compliant (no inline handlers)
// All event handlers attached via addEventListener

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Onboarding] Initializing...');

    let currentStep = 1;
    const totalSteps = 5;
    let selectedSites = ['instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'reddit.com'];
    let squatsPerSession = 10;

    // ===========================================
    // NAVIGATION
    // ===========================================
    function nextStep() {
        console.log('[Onboarding] nextStep called, current:', currentStep);
        if (currentStep < totalSteps) {
            const currentScreen = document.getElementById(`screen${currentStep}`);
            const dots = document.querySelectorAll('.step-dot');

            if (currentScreen) currentScreen.classList.remove('active');
            if (dots[currentStep - 1]) {
                dots[currentStep - 1].classList.remove('active');
                dots[currentStep - 1].classList.add('completed');
            }

            currentStep++;

            const nextScreen = document.getElementById(`screen${currentStep}`);
            if (nextScreen) nextScreen.classList.add('active');
            if (currentStep <= 4 && dots[currentStep - 1]) {
                dots[currentStep - 1].classList.add('active');
            }
        }
    }

    // ===========================================
    // SQUATS SLIDER
    // ===========================================
    function updateSquats() {
        const slider = document.getElementById('squatsSlider');
        if (!slider) return;

        squatsPerSession = parseInt(slider.value);

        const valueEl = document.getElementById('squatsValue');
        if (valueEl) valueEl.textContent = squatsPerSession;

        const hint = document.getElementById('difficultyHint');
        if (hint) {
            if (squatsPerSession <= 5) hint.textContent = '🌱 Easy start';
            else if (squatsPerSession <= 10) hint.textContent = '💪 Moderate challenge';
            else if (squatsPerSession <= 15) hint.textContent = '🔥 Serious workout';
            else hint.textContent = '🏆 Beast mode!';
        }

        const dailySquats = squatsPerSession * 5;
        const dailyGoalEl = document.getElementById('dailyGoal');
        const caloriesEl = document.getElementById('caloriesBurned');
        if (dailyGoalEl) dailyGoalEl.textContent = `~${dailySquats} squats`;
        if (caloriesEl) caloriesEl.textContent = `~${Math.round(dailySquats * 0.5)} kcal`;
    }

    // ===========================================
    // ADD CUSTOM SITE
    // ===========================================
    function addCustomSite() {
        const input = document.getElementById('customSite');
        if (!input) return;

        let site = input.value.trim().toLowerCase();
        if (!site) return;

        site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

        if (site && !selectedSites.includes(site)) {
            selectedSites.push(site);

            const grid = document.getElementById('sites-grid');
            if (grid) {
                const card = document.createElement('div');
                card.className = 'site-card selected';
                card.dataset.site = site;
                card.innerHTML = `
                    <div class="check">✓</div>
                    <div class="icon">🌐</div>
                    <div class="name">${site}</div>
                `;
                card.addEventListener('click', () => toggleSite(card, site));
                grid.appendChild(card);
            }
            input.value = '';
        }
    }

    // ===========================================
    // TOGGLE SITE SELECTION
    // ===========================================
    function toggleSite(card, site) {
        card.classList.toggle('selected');
        if (card.classList.contains('selected')) {
            if (!selectedSites.includes(site)) selectedSites.push(site);
        } else {
            selectedSites = selectedSites.filter(s => s !== site);
        }
        console.log('[Onboarding] Selected sites:', selectedSites);
    }

    // ===========================================
    // FINISH SETUP
    // ===========================================
    async function finishSetup() {
        console.log('[Onboarding] Saving settings...');
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({
                    blockedSites: selectedSites,
                    squatsPerSession: squatsPerSession,
                    onboardingComplete: true,
                    blockingEnabled: true
                });
                console.log('[Onboarding] Settings saved successfully');
            }
        } catch (e) {
            console.error('[Onboarding] Error saving:', e);
        }

        const siteCountEl = document.getElementById('siteCount');
        const squatsEl = document.getElementById('squatsPerSession');
        if (siteCountEl) siteCountEl.textContent = selectedSites.length;
        if (squatsEl) squatsEl.textContent = squatsPerSession;

        nextStep();
    }

    // ===========================================
    // CLOSE ONBOARDING
    // ===========================================
    function closeOnboarding() {
        window.close();
    }

    // ===========================================
    // ATTACH EVENT LISTENERS
    // ===========================================

    // Navigation buttons
    document.getElementById('btn-start')?.addEventListener('click', nextStep);
    document.getElementById('btn-pinned')?.addEventListener('click', nextStep);
    document.getElementById('btn-skip-pin')?.addEventListener('click', nextStep);
    document.getElementById('btn-continue-sites')?.addEventListener('click', nextStep);
    document.getElementById('btn-finish')?.addEventListener('click', finishSetup);
    document.getElementById('btn-close')?.addEventListener('click', closeOnboarding);

    // Add site button
    document.getElementById('btn-add-site')?.addEventListener('click', addCustomSite);

    // Custom site input - Enter key
    document.getElementById('customSite')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCustomSite();
    });

    // Squats slider
    document.getElementById('squatsSlider')?.addEventListener('input', updateSquats);

    // Site cards
    document.querySelectorAll('.site-card').forEach(card => {
        const site = card.dataset.site;
        card.addEventListener('click', () => toggleSite(card, site));
    });

    console.log('[Onboarding] Initialization complete');
});
