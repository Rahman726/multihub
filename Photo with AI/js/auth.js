// ===================== DOM =====================
const authOverlay = document.getElementById('authOverlay');
const authModal = document.getElementById('authModal');
const authClose = document.getElementById('authClose');
const authGate = document.getElementById('authGate');
const loginBtn = document.getElementById('loginBtn');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

// ===================== AUTH =====================
const API_BASE = '/api'; // Will be proxied through hub

// Offline-first auth: use localStorage immediately, then verify with server if available
let currentUser = JSON.parse(localStorage.getItem('photoStoreUser') || 'null');
let authToken = localStorage.getItem('photoStoreToken') || '';

// Storage keys for local-only accounts (offline mode)
const LOCAL_USERS_KEY = 'photoStoreLocalUsers';

function initAuth() {
    // Check if coming from Hub with token
    const hubToken = sessionStorage.getItem('hubToken');
    if (hubToken) {
        authToken = hubToken;
        localStorage.setItem('photoStoreToken', hubToken);
        sessionStorage.removeItem('hubToken');
        // Create a dummy user for hub authentication
        currentUser = { name: 'Hub User', email: 'hub@user.com' };
        localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
        updateAuthUI();
        hideAuthGate();
        return;
    }

    // Update login button based on auth state
    updateAuthUI();

    // If we have a token saved, try to verify with server (non-blocking)
    if (authToken && currentUser) {
        verifyToken().catch(() => {
            // Server not available — use local user data
            console.log('Server offline, using local auth');
            updateAuthUI();
        });
    }
    
    // Open modal on login click
    loginBtn.addEventListener('click', openAuthModal);
    
    // Close modal
    authClose.addEventListener('click', closeAuthModal);
    authOverlay.addEventListener('click', closeAuthModal);
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal.classList.contains('open')) {
            closeAuthModal();
        }
    });
    
    // Check if there are local users saved
    initLocalUsers();
}

function initLocalUsers() {
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
    // If we have local users and currentUser exists but no server, just use local
    if (Object.keys(localUsers).length > 0 && !navigator.onLine) {
        // We might have a matching local user
        if (currentUser && localUsers[currentUser.name]) {
            currentUser = localUsers[currentUser.name];
            localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
            updateAuthUI();
        }
    }
}

async function verifyToken() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
            updateAuthUI();
            hideAuthGate();
            return;
        } else {
            // Token invalid, clear it
            logout();
        }
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.log('Token verification timed out — using local auth');
        } else {
            console.error('Token verification failed:', error);
        }
        // Don't clear user — keep local session
        updateAuthUI();
    }
}

function showAuthGate() {
    if (authGate) authGate.classList.add('active');
    authModal.classList.add('open');
    authOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function hideAuthGate() {
    if (authGate) authGate.classList.remove('active');
    authModal.classList.remove('open');
    authOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

function openAuthModal() {
    if (currentUser) {
        // If logged in, show logout option
        if (confirm('Do you want to logout?')) {
            logout();
        }
    } else {
        authModal.classList.add('open');
        authOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModal() {
    authModal.classList.remove('open');
    authOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

function switchTab(tabName) {
    authTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    if (tabName === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Try server first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
            localStorage.setItem('photoStoreToken', authToken);

            updateAuthUI();
            hideAuthGate();
            showToast('Welcome back! 👋');
            loginForm.reset();
            return;
        } else {
            showToast(data.error || 'Login failed');
        }
    } catch (error) {
        // Server offline — try local users
        if (error.name === 'AbortError' || error instanceof TypeError) {
            console.log('Server offline, trying local login');
            tryLocalLogin(email, password);
        } else {
            showToast('⚠️ Server error: ' + error.message);
        }
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    if (!name) {
        showToast('Please enter your name!');
        return;
    }

    // Try server first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
            localStorage.setItem('photoStoreToken', authToken);

            updateAuthUI();
            hideAuthGate();
            showToast('Account created successfully! 🎉');
            signupForm.reset();
            if (typeof trackUserSignup === 'function') trackUserSignup(name);
            return;
        } else {
            showToast(data.error || 'Signup failed');
        }
    } catch (error) {
        // Server offline — create local account
        if (error.name === 'AbortError' || error instanceof TypeError) {
            console.log('Server offline, creating local account');
            createLocalAccount(name);
        } else {
            showToast('⚠️ Server error: ' + error.message);
        }
    }
}

// ===================== OFFLINE AUTH (localStorage) =====================

function tryLocalLogin(email, password) {
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
    
    // Find local user by email
    const userEntry = Object.values(localUsers).find(u => u.email === email);
    
    if (userEntry && userEntry.password === password) {
        // Simple local login success
        currentUser = {
            id: userEntry.id,
            name: userEntry.name,
            email: userEntry.email
        };
        authToken = 'local-token-' + Date.now();
        localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
        localStorage.setItem('photoStoreToken', authToken);
        
        updateAuthUI();
        hideAuthGate();
        showToast('Welcome back (offline mode)! 👋');
        loginForm.reset();
    } else {
        showToast('⚠️ Server is offline. Please sign up first or try again later.');
    }
}

function createLocalAccount(name) {
    const localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
    
    const randomId = 'local-' + Date.now();
    const email = `user-${name.toLowerCase().replace(/\s/g, '')}@local.app`;
    const generatedPassword = Math.random().toString(36).slice(2, 12);
    
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: generatedPassword,
        createdAt: new Date().toISOString()
    };
    
    localUsers[name] = newUser;
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
    
    currentUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
    };
    authToken = 'local-token-' + Date.now();
    localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
    localStorage.setItem('photoStoreToken', authToken);
    
    updateAuthUI();
    hideAuthGate();
    showToast('Account created (offline mode)! 🎉\nUse email: ' + email);
    signupForm.reset();
    if (typeof trackUserSignup === 'function') trackUserSignup(name);
}

async function logout() {
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 2000);
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            signal: controller.signal
        });
    } catch (error) {
        // Server offline, just clear local
        console.log('Logout (offline):', error.message);
    }

    currentUser = null;
    authToken = '';
    localStorage.removeItem('photoStoreUser');
    localStorage.removeItem('photoStoreToken');
    updateAuthUI();
    closeAuthModal();
    showToast('Logged out successfully');
}

function updateAuthUI() {
    if (currentUser) {
        loginBtn.textContent = currentUser.name;
        loginBtn.classList.add('logged-in');
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.classList.remove('logged-in');
    }
}

// ===================== GOOGLE SIGN-IN =====================

window.handleGoogleCredentialResponse = async (response) => {
    try {
        const credential = response.credential;

        const controller = new AbortController();
        setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential }),
            signal: controller.signal
        });

        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            authToken = data.token;
            localStorage.setItem('photoStoreUser', JSON.stringify(currentUser));
            localStorage.setItem('photoStoreToken', authToken);

            updateAuthUI();
            hideAuthGate();
            showToast('Signed in with Google! 🚀');
        } else {
            showToast(data.error || 'Google sign-in failed');
        }
    } catch (error) {
        if (error.name === 'AbortError' || error instanceof TypeError) {
            showToast('⚠️ Server offline. Google sign-in unavailable.');
        } else {
            console.error('Google sign-in error:', error);
            showToast('Server error. Please try again.');
        }
    }
};
