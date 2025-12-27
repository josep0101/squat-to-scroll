// Onboarding Script
// Handles the onboarding flow for first-time users

let currentStep = 1;
const totalSteps = 5;

// Selected sites (starts with defaults)
let selectedSites = ['instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com', 'reddit.com'];
let squatsPerSession = 10;

// Navigation
function nextStep() {
    if (currentStep < totalSteps) {
        document.getElementById(`screen${currentStep}`).classList.remove('active');
        document.querySelectorAll('.step-dot')[currentStep - 1].classList.remove('active');
        document.querySelectorAll('.step-dot')[currentStep - 1].classList.add('completed');

        currentStep++;

        document.getElementById(`screen${currentStep}`).classList.add('active');
        if (currentStep <= 4) {
            document.querySelectorAll('.step-dot')[currentStep - 1].classList.add('active');
        }
    }
}

// Site selection
document.querySelectorAll('.site-card').forEach(card => {
    card.addEventListener('click', () => {
        const site = card.dataset.site;
        card.classList.toggle('selected');

        if (card.classList.contains('selected')) {
            if (!selectedSites.includes(site)) {
                selectedSites.push(site);
            }
        } else {
            selectedSites = selectedSites.filter(s => s !== site);
        }
    });
});

// Add custom site
function addCustomSite() {
    const input = document.getElementById('customSite');
    let site = input.value.trim().toLowerCase();

    if (!site) return;

    // Normalize the site
    site = site.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

    if (site && !selectedSites.includes(site)) {
        selectedSites.push(site);

        // Add to grid
        const grid = document.querySelector('.sites-grid');
        const card = document.createElement('div');
        card.className = 'site-card selected';
        card.dataset.site = site;
        card.innerHTML = `
            <div class="check">✓</div>
            <div class="icon">🌐</div>
            <div class="name">${site}</div>
        `;
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            if (card.classList.contains('selected')) {
                if (!selectedSites.includes(site)) {
                    selectedSites.push(site);
                }
            } else {
                selectedSites = selectedSites.filter(s => s !== site);
            }
        });
        grid.appendChild(card);

        input.value = '';
    }
}

// Update squats slider
function updateSquats() {
    const slider = document.getElementById('squatsSlider');
    squatsPerSession = parseInt(slider.value);

    document.getElementById('squatsValue').textContent = squatsPerSession;

    // Update hint
    const hint = document.getElementById('difficultyHint');
    if (squatsPerSession <= 5) {
        hint.textContent = '🌱 Easy start';
    } else if (squatsPerSession <= 10) {
        hint.textContent = '💪 Moderate challenge';
    } else if (squatsPerSession <= 15) {
        hint.textContent = '🔥 Serious workout';
    } else {
        hint.textContent = '🏆 Beast mode!';
    }

    // Update estimates
    const dailySquats = squatsPerSession * 5; // Assume 5 unlock sessions per day
    document.getElementById('dailyGoal').textContent = `~${dailySquats} squats`;
    document.getElementById('caloriesBurned').textContent = `~${Math.round(dailySquats * 0.5)} kcal`;
}

// Finish setup
async function finishSetup() {
    try {
        // Save settings to chrome.storage
        await chrome.storage.local.set({
            blockedSites: selectedSites,
            squatsPerSession: squatsPerSession,
            onboardingComplete: true,
            blockingEnabled: true
        });

        // Update final screen
        document.getElementById('siteCount').textContent = selectedSites.length;
        document.getElementById('squatsPerSession').textContent = squatsPerSession;

        // Go to success screen
        nextStep();
    } catch (e) {
        console.error('Error saving settings:', e);
        // Still proceed even if storage fails
        nextStep();
    }
}

// Close onboarding
function closeOnboarding() {
    // Close the tab
    window.close();
}

// Enter key support for custom site
document.getElementById('customSite')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addCustomSite();
    }
});
