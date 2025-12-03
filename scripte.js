document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let appState = {
        auth: { email: '', password: '', userId: '' },
        projectType: '', // 'full-website', 'landing-page', 'ai-creative'
        fullWebsite: { 
            languages: { secondary: [] }, 
            hero: { type: '' }, 
            ads: { enabled: false, code: '' },
            footer: { copyright: '', social: {} }
        },
        landingPage: { primaryColor: '', footer: { copyright: '' } },
        aiCreative: { description: '' }
    };

    // --- DOM Elements ---
    const pages = document.querySelectorAll('.page');
    const authForm = document.getElementById('auth-form');
    const userIdDisplay = document.getElementById('user-id-display');
    const generatedUserId = document.getElementById('generated-user-id');
    const startPageOptions = document.querySelectorAll('.option-card');
    const wizardContent = document.querySelectorAll('.wizard-content');
    const progressFill = document.getElementById('progress-fill');
    const summaryContent = document.getElementById('summary-content');

    // --- Local Storage ---
    const storageKey = 'websiteGeneratorState';
    function saveState() {
        localStorage.setItem(storageKey, JSON.stringify(appState));
    }

    function loadState() {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
            appState = JSON.parse(savedState);
            // Restore UI from state if needed (e.g., after refresh)
            if (appState.auth.userId) {
                generatedUserId.textContent = appState.auth.userId;
                userIdDisplay.classList.remove('hidden');
            }
            if (appState.projectType) {
                 showPage('wizard-page');
                 showWizard(appState.projectType);
            }
        }
    }
    
    // --- Page Navigation ---
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    // --- Auth Logic ---
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (email && password) {
            appState.auth.email = email;
            appState.auth.password = password; // In a real app, NEVER store password in plain text
            appState.auth.userId = 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            
            generatedUserId.textContent = appState.auth.userId;
            userIdDisplay.classList.remove('hidden');
            
            saveState();
            setTimeout(() => showPage('start-page'), 1500); // Show user ID before moving on
        }
    });

    // --- Start Page Logic ---
    startPageOptions.forEach(button => {
        button.addEventListener('click', () => {
            appState.projectType = button.dataset.projectType;
            saveState();
            showPage('wizard-page');
            showWizard(appState.projectType);
        });
    });

    // --- Wizard Logic ---
    let currentStep = 1;
    const totalSteps = { 'full-website': 4, 'landing-page': 2, 'ai-creative': 1 };

    function showWizard(type) {
        wizardContent.forEach(content => content.classList.add('hidden'));
        document.getElementById(`wizard-${type}`).classList.remove('hidden');
        currentStep = 1;
        updateProgressBar();
        showStep(currentStep);
    }

    function showStep(step) {
        const activeWizard = document.querySelector('.wizard-content:not(.hidden)');
        activeWizard.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
        activeWizard.querySelector(`.wizard-step:nth-child(${step})`).classList.add('active');
    }

    function nextStep() {
        const activeWizardTotal = totalSteps[appState.projectType];
        if (currentStep < activeWizardTotal) {
            currentStep++;
            showStep(currentStep);
            updateProgressBar();
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
            updateProgressBar();
        }
    }

    function updateProgressBar() {
        const activeWizardTotal = totalSteps[appState.projectType];
        const progress = (currentStep / activeWizardTotal) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    // --- Dynamic Content & Data Binding ---
    // Hero Background Selection
    document.querySelectorAll('.selector-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.selector-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const value = card.dataset.value;
            const optionsContainer = document.getElementById('hero-bg-options');
            optionsContainer.innerHTML = ''; // Clear previous options
            appState.fullWebsite.hero.type = value;

            if (value === 'image') {
                optionsContainer.innerHTML = `
                    <div class="input-group"><label>رابط الصورة</label><input type="url" data-state-key="fullWebsite.hero.imageUrl"></div>
                    <div class="input-group"><label>لون طبقة فوق الصورة</label><input type="color" data-state-key="fullWebsite.hero.overlayColor"></div>
                `;
            } else if (value === 'animated') {
                optionsContainer.innerHTML = `
                    <p>اختر نوع الأنيميشن:</p>
                    <select data-state-key="fullWebsite.hero.animationType">
                        <option value="morphing">Morphing Gradient</option>
                        <option value="floating">Floating Shapes</option>
                        <option value="waves">Waves</option>
                    </select>
                `;
            } else if (value === 'solid') {
                 optionsContainer.innerHTML = `
                    <div class="input-group"><label>اللون</label><input type="color" data-state-key="fullWebsite.hero.solidColor"></div>
                `;
            }
            // Re-bind events for new inputs
            bindInputEvents();
        });
    });

    // Ads Toggle
    const adsToggle = document.getElementById('ads-enabled');
    const adsOptions = document.getElementById('ads-options');
    if(adsToggle) {
        adsToggle.addEventListener('change', () => {
            if (adsToggle.checked) {
                adsOptions.classList.remove('hidden');
            } else {
                adsOptions.classList.add('hidden');
            }
        });
    }
    
    // Generic Data Binding
    function bindInputEvents() {
        document.querySelectorAll('input, textarea, select').forEach(input => {
            // Skip if already has listener to avoid duplication
            if (input.hasAttribute('data-listener-bound')) return;
            input.setAttribute('data-listener-bound', 'true');

            const stateKey = input.dataset.stateKey;
            if (stateKey) {
                const eventType = input.type === 'checkbox' ? 'change' : 'input';
                input.addEventListener(eventType, () => {
                    const keys = stateKey.split('.');
                    let value = input.type === 'checkbox' ? input.checked : input.value;
                    
                    // Handle arrays for checkboxes
                    if(input.type === 'checkbox' && input.name === 'languages') {
                         if(!appState.fullWebsite.languages.secondary.includes(value)) {
                            appState.fullWebsite.languages.secondary.push(value);
                         } else {
                            appState.fullWebsite.languages.secondary = appState.fullWebsite.languages.secondary.filter(item => item !== value);
                         }
                    } else {
                         // Set nested property
                         let target = appState;
                         for (let i = 0; i < keys.length - 1; i++) {
                             target = target[keys[i]];
                         }
                         target[keys[keys.length - 1]] = value;
                    }
                    saveState();
                });
            }
        });
    }

    // --- Summary & Submission ---
    function goToSummary() {
        showPage('summary-page');
        summaryContent.textContent = JSON.stringify(appState, null, 2);
    }

    function submitData() {
        // In a real application, you would send this data to a server
        console.log('Submitting final JSON:', appState);
        
        // Simulate sending data
        alert('تم إنشاء ملف JSON بنجاح! (انظر إلى وحدة التحكم - Console)');
        
        // Optional: Clear state and restart
        // localStorage.removeItem(storageKey);
        // location.reload();
    }

    // --- Initial Load ---
    loadState();
    bindInputEvents(); // Initial binding for static elements
});
