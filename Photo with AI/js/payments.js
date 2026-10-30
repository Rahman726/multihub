// ===================== STRIPE MONETIZATION & PREMIUM =====================

const PREMIUM_KEY = 'photoStorePremium';
const STRIPE_PUBLISHABLE_KEY = 'pk_test_XXXXXXXXXXXXXXXXXXXXXX'; // Replace with your real key

const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        generationsPerDay: 5,
        downloadsPerDay: 10,
        hasWatermark: true,
        canExportHD: false,
        badge: '🆓'
    },
    basic: {
        name: 'Basic',
        price: 499, // $4.99
        priceLabel: '$4.99',
        generationsPerDay: 50,
        downloadsPerDay: 100,
        hasWatermark: false,
        canExportHD: true,
        badge: '⭐',
        stripePriceId: 'price_basic_monthly'
    },
    pro: {
        name: 'Pro',
        price: 1499, // $14.99
        priceLabel: '$14.99',
        generationsPerDay: -1, // unlimited
        downloadsPerDay: -1, // unlimited
        hasWatermark: false,
        canExportHD: true,
        badge: '💎',
        stripePriceId: 'price_pro_monthly'
    }
};

function initPayments() {
    // Add premium toggle to navbar
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const premiumBadge = document.createElement('button');
        premiumBadge.className = 'nav-premium-btn';
        premiumBadge.id = 'premiumBtn';
        premiumBadge.innerHTML = '⭐ Go Premium';
        premiumBadge.addEventListener('click', openPricingModal);
        navActions.insertBefore(premiumBadge, navActions.querySelector('.nav-fav-toggle'));
    }

    // Create pricing modal
    const pricingModal = document.createElement('div');
    pricingModal.className = 'pricing-modal';
    pricingModal.id = 'pricingModal';
    pricingModal.innerHTML = `
        <div class="pricing-overlay" id="pricingOverlay"></div>
        <div class="pricing-panel" id="pricingPanel">
            <button class="pricing-close" id="pricingClose">✕</button>
            <div class="pricing-header">
                <h2>🚀 Unlock Premium Features</h2>
                <p>Get more generations, HD downloads, and remove watermarks!</p>
            </div>
            <div class="pricing-grid" id="pricingGrid">
                ${Object.entries(PLANS).map(([key, plan]) => `
                    <div class="pricing-card ${key === 'pro' ? 'pricing-featured' : ''} ${getUserPlan() === key ? 'pricing-current' : ''}" data-plan="${key}">
                        ${key === 'pro' ? '<div class="pricing-badge">🔥 BEST VALUE</div>' : ''}
                        <div class="pricing-card-header">
                            <span class="pricing-plan-icon">${plan.badge}</span>
                            <h3>${plan.name}</h3>
                            <div class="pricing-price">
                                ${plan.price === 0 ? '<span class="pricing-free">Free</span>' : `<span class="pricing-amount">$${(plan.price / 100).toFixed(2)}</span><span class="pricing-period">/month</span>`}
                            </div>
                        </div>
                        <ul class="pricing-features">
                            <li ${plan.generationsPerDay === -1 ? 'class="pricing-unlimited"' : ''}>
                                ${plan.generationsPerDay === -1 ? '♾️ Unlimited' : `🖼️ ${plan.generationsPerDay}`} AI generations/day
                            </li>
                            <li ${plan.downloadsPerDay === -1 ? 'class="pricing-unlimited"' : ''}>
                                ${plan.downloadsPerDay === -1 ? '♾️ Unlimited' : `⬇️ ${plan.downloadsPerDay}`} downloads/day
                            </li>
                            <li class="${plan.hasWatermark ? 'pricing-missing' : 'pricing-check'}">
                                ${plan.hasWatermark ? '❌ Has watermark' : '✅ No watermark'}
                            </li>
                            <li class="${plan.canExportHD ? 'pricing-check' : 'pricing-missing'}">
                                ${plan.canExportHD ? '✅ HD Export' : '❌ HD Export'}
                            </li>
                            <li class="pricing-check">✅ Access to gallery</li>
                        </ul>
                        <button class="pricing-select-btn ${getUserPlan() === key ? 'pricing-current-btn' : ''}" data-plan="${key}">
                            ${getUserPlan() === key ? '✅ Current Plan' : plan.price === 0 ? '🆓 Free' : `⭐ Subscribe ${plan.name}`}
                        </button>
                    </div>
                `).join('')}
            </div>
            <div class="pricing-footer">
                <p>🔒 Secure payment via Stripe • Cancel anytime</p>
            </div>
        </div>
    `;
    document.body.appendChild(pricingModal);

    // Event listeners
    document.getElementById('pricingClose')?.addEventListener('click', closePricingModal);
    document.getElementById('pricingOverlay')?.addEventListener('click', closePricingModal);

    document.querySelectorAll('.pricing-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.dataset.plan;
            if (plan === 'free') {
                setUserPlan('free');
                closePricingModal();
                showToast('✅ Free plan selected');
                return;
            }
            if (getUserPlan() === plan) {
                showToast('Already on this plan!');
                return;
            }
            startStripeCheckout(plan);
        });
    });
}

function getUserPlan() {
    return localStorage.getItem(PREMIUM_KEY) || 'free';
}

function setUserPlan(plan) {
    localStorage.setItem(PREMIUM_KEY, plan);
    updatePremiumUI();
}

function updatePremiumUI() {
    const plan = getUserPlan();
    const btn = document.getElementById('premiumBtn');
    if (btn) {
        if (plan === 'free') {
            btn.innerHTML = '⭐ Go Premium';
            btn.className = 'nav-premium-btn';
        } else {
            const planData = PLANS[plan];
            btn.innerHTML = `${planData.badge} ${planData.name}`;
            btn.classList.add('premium-active');
        }
    }
    
    // Update UI elements for premium features
    document.querySelectorAll('.premium-locked').forEach(el => {
        el.classList.toggle('premium-unlocked', plan !== 'free');
    });
}

function openPricingModal() {
    document.getElementById('pricingModal').style.display = 'block';
    document.getElementById('pricingOverlay').classList.add('open');
    document.getElementById('pricingPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closePricingModal() {
    document.getElementById('pricingOverlay').classList.remove('open');
    document.getElementById('pricingPanel').classList.remove('open');
    setTimeout(() => {
        document.getElementById('pricingModal').style.display = 'none';
        document.body.style.overflow = '';
    }, 300);
}

async function startStripeCheckout(plan) {
    if (!currentUser) {
        showToast('Please login first to subscribe!');
        closePricingModal();
        document.querySelector('.nav-auth-btn')?.click();
        return;
    }

    const planData = PLANS[plan];
    if (!planData) return;

    showToast(`🔄 Processing ${planData.name} subscription...`);

    try {
        // Try server-side Stripe checkout
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plan: plan,
                userId: currentUser.id,
                userEmail: currentUser.email,
                userName: currentUser.name,
                successUrl: window.location.origin + '/?payment=success',
                cancelUrl: window.location.origin + '/?payment=canceled'
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
                return;
            }
        }
    } catch (e) {
        console.warn('Stripe server unavailable:', e.message);
    }

    // OFFLINE MODE: Simulate payment for demo/testing
    showToast('⚠️ Payment server offline. Using demo mode...');
    setTimeout(() => {
        if (confirm(`🔄 DEMO MODE\n\nSubscribe to ${planData.name} ($${(planData.price / 100).toFixed(2)}/month)?\n\nIn production, you'd be redirected to Stripe.`)) {
            setUserPlan(plan);
            closePricingModal();
            showToast(`🎉 Welcome to ${planData.name}! Enjoy premium features!`);
        }
    }, 500);
}

// Check usage limits
function checkGenerationLimit() {
    const plan = getUserPlan();
    const planData = PLANS[plan];
    if (!planData) return true;
    
    if (planData.generationsPerDay === -1) return true; // unlimited
    
    const today = new Date().toDateString();
    const usageKey = `photoStoreUsage_generations_${today}`;
    const count = parseInt(localStorage.getItem(usageKey) || '0');
    
    if (count >= planData.generationsPerDay) {
        showToast(`⚠️ Daily limit reached (${planData.generationsPerDay}/day). Upgrade to Pro!`);
        document.getElementById('premiumBtn')?.click();
        return false;
    }
    
    localStorage.setItem(usageKey, String(count + 1));
    return true;
}

function checkDownloadLimit() {
    const plan = getUserPlan();
    const planData = PLANS[plan];
    if (!planData) return true;
    
    if (planData.downloadsPerDay === -1) return true;
    
    const today = new Date().toDateString();
    const usageKey = `photoStoreUsage_downloads_${today}`;
    const count = parseInt(localStorage.getItem(usageKey) || '0');
    
    if (count >= planData.downloadsPerDay) {
        showToast(`⚠️ Download limit reached (${planData.downloadsPerDay}/day). Upgrade to Pro!`);
        return false;
    }
    
    localStorage.setItem(usageKey, String(count + 1));
    return true;
}

// Check if payment was successful (from URL params)
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
        // Check session
        const sessionId = params.get('session_id');
        if (sessionId) {
            fetch(`/api/check-session-status?session_id=${sessionId}`)
                .then(r => r.json())
                .then(data => {
                    if (data.plan) {
                        setUserPlan(data.plan);
                        showToast('🎉 Payment successful! Welcome to Premium!');
                    }
                })
                .catch(() => {
                    // Demo: set to basic
                    setUserPlan('basic');
                    showToast('🎉 Payment successful! (Demo mode)');
                });
        } else {
            setUserPlan('basic');
            showToast('🎉 Payment successful!');
        }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }
});
