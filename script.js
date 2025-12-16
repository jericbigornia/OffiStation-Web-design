/*
 ==========================================
  OFFISTATION JAVASCRIPT CORE LOGIC
 ==========================================

 OVERVIEW:
 This file is the "brain" of the OffiStation e-commerce site. It handles:
  • Shopping cart persistence using browser localStorage
  • User authentication state management
  • Catalog product interactions (Add to Cart functionality)
  • Cart page rendering and checkout calculations
  • Voucher/discount system (OFFI2025, BULK10)
  • Header scroll animations (shrink-on-scroll effect)
  • Mobile navigation toggle (hamburger menu)
  • Toast notifications for user feedback

 DATA STORAGE:
  - cartItems: Array of { id, name, price, image, quantity }
  - os_current_user: Boolean flag indicating login state
  - os_active_voucher: Active voucher code string
  - os_toc_agreed: Boolean flag for Terms & Conditions acceptance

 KEY FUNCTIONS:
  ✓ Cart: getCartItems(), saveCart(), addItemToCart()
  ✓ Auth: isLoggedIn(), showAuthPrompt(), doLogout()
  ✓ Catalog: setupCatalog() - attaches event listeners to Add to Cart buttons
  ✓ Display: renderCart(), updateCartCount(), calculateCartTotals()
  ✓ Vouchers: getVoucherByCode(), calculateVoucherDiscount()
*/

// ================= CART & STORAGE HELPERS =================
const SHIPPING_FEE = 150.00;

// Predefined voucher codes with rules (for demo/testing)
const VOUCHERS = {
    'OFFI2025': { code: 'OFFI2025', type: 'amount', amount: 100.00, minSpend: 500.00, description: '₱100 OFF min. spend ₱500' },
    'BULK10': { code: 'BULK10', type: 'percent', percent: 10, minSpend: 2000.00, description: '10% OFF orders above ₱2,000' }
};

// ===== VOUCHER CODE MANAGEMENT =====
// Retrieve the currently active voucher code from localStorage
function getActiveVoucherCode() {
    try { return localStorage.getItem('os_active_voucher') || null; } catch (e) { return null; }
}

// Store a new voucher code as active
function setActiveVoucherCode(code) {
    try { if (code) localStorage.setItem('os_active_voucher', code); else localStorage.removeItem('os_active_voucher'); } catch (e) {}
}

// Remove the active voucher and show feedback
function clearActiveVoucher() {
    try { localStorage.removeItem('os_active_voucher'); } catch (e) {}
    showToast('Voucher removed');
}

// Retrieve voucher object by code, with case-insensitive lookup
function getVoucherByCode(code) {
    if (!code) return null;
    const up = String(code).trim().toUpperCase();
    return VOUCHERS[up] || null;
}

// Format numbers as Philippine Peso currency (used by cart/checkout)
function formatPrice(price) {
    try {
        const n = Number(price) || 0;
        return `₱ ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    } catch (e) { return `₱ ${Number(price || 0).toFixed(2)}`; }
}

// Calculate discount amount based on active voucher and cart items
// Returns 0 if no voucher applied or minimum spend not met
function calculateVoucherDiscount(cart, code) {
    const voucher = getVoucherByCode(code);
    if (!voucher) return 0;
    const subtotal = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    if (subtotal <= 0) return 0;
    if (voucher.minSpend && subtotal < voucher.minSpend) return 0; // min spend not met
    if (voucher.type === 'amount') return Math.min(voucher.amount, subtotal); // fixed discount
    if (voucher.type === 'percent') return +(subtotal * (voucher.percent / 100)); // percentage discount
    return 0;
}



// ===== CART PERSISTENCE =====
// Retrieve cart items from browser localStorage
function getCartItems() {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

// Write cart array to localStorage and update UI badge
function saveCart(cart) {
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartCount(); // refresh the badge number in header
}

// Update the cart count badge in the header (shows total quantity)
function updateCartCount() {
    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;
    cartCountElement.textContent = totalItems > 99 ? '99+' : totalItems;
    cartCountElement.setAttribute('data-count', totalItems);
}

// Add an item to cart or increase qty if already present
function addItemToCart(newItem) {
    const cart = getCartItems();
    const existing = cart.find(i => i.id === newItem.id);
    if (existing) {
        existing.quantity += newItem.quantity; // increase qty
    } else {
        // Normalize image URL before saving to avoid encoding issues
        if (newItem.image) newItem.image = normalizeImageUrl(newItem.image);
        cart.push(newItem);
    }
    saveCart(cart); // persist to localStorage
}



// Normalize image URLs to avoid spaces/special-char loading issues.

function normalizeImageUrl(url) {

    if (!url) return url;

    try {

        // decode first to avoid double-encoding

        const decoded = decodeURI(url);

        return encodeURI(decoded);

    } catch (e) {

        try { return encodeURI(url); } catch (err) { return url; }

    }

}



function migrateStoredImages() {

    const cart = getCartItems();

    let changed = false;

    for (const item of cart) {

        if (item.image) {

            const norm = normalizeImageUrl(item.image);

            if (norm !== item.image) { item.image = norm; changed = true; }

        }

    }

    if (changed) saveCart(cart);

}



function calculateCartTotals(cart) {

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const appliedCode = getActiveVoucherCode();
    const discount = appliedCode ? calculateVoucherDiscount(cart, appliedCode) : 0;
    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    const total = Math.max(0, subtotal - (discount || 0)) + shipping;
    return { subtotal, discount, shipping, total, itemCount, appliedVoucher: appliedCode };

}



// Simple transient toast

function showToast(message, timeout = 900) {

    const t = document.createElement('div');

    t.textContent = message;

    Object.assign(t.style, {

        position: 'fixed',

        bottom: '30px',

        left: '50%',

        transform: 'translateX(-50%)',

        background: 'rgba(0,0,0,0.85)',

        color: '#fff',

        padding: '10px 14px',

        borderRadius: '6px',

        fontSize: '14px',

        zIndex: 9999,

        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'

    });

    document.body.appendChild(t);

    setTimeout(() => {

        t.style.transition = 'opacity 220ms, transform 220ms';

        t.style.opacity = '0';

        t.style.transform = 'translateX(-50%) translateY(8px)';

        setTimeout(() => t.remove(), 260);

    }, timeout);

}

// ================= CATALOG PAGE: PRODUCT INTERACTIONS =================
// Setup: Attach event listeners to all "Add to Cart" buttons on catalog/promo pages
// Triggered on page load if .product-card elements exist in DOM
function setupCatalog() {
    updateCartCount(); // refresh cart badge on page load
    const buttons = document.querySelectorAll('.add-to-cart-btn');
    buttons.forEach(btn => {


        btn.addEventListener('click', (e) => {

            const card = e.target.closest('.product-card');

            if (!card) return;

            const id = card.dataset.id;

            const name = card.dataset.name;

            const price = parseFloat((card.dataset.price || '0').replace(/,/g, '')) || 0;

            // Use the displayed img src (may contain spaces) if present

            const imgElem = card.querySelector('.product-photo img');

            const image = (imgElem && imgElem.src) ? imgElem.src : (card.dataset.image || '');


            // Require login: if user is not logged in, save pending add and redirect to login/signup
            if (!isLoggedIn()) {
                try { localStorage.setItem('os_pending_add', JSON.stringify({ id, name, price, image, quantity: 1 })); } catch (err) {}
                requireLogin(window.location.href);
                return;
            }

            // User is logged in — proceed to add to cart
            addItemToCart({ id, name, price, image, quantity: 1 });
            showToast('Added to cart!');



            // brief button feedback

            const orig = e.target.textContent;

            e.target.textContent = 'Added!';

            e.target.disabled = true;

            setTimeout(() => {

                e.target.textContent = orig;

                e.target.disabled = false;

            }, 800);

        });

    });

}



// Authentication helpers



function showAuthPrompt() {

    // Create or show a styled auth prompt banner/modal in the page

    let prompt = document.getElementById('auth-prompt-modal');

    if (!prompt) {

        const html = `

            <div id="auth-prompt-modal" class="auth-prompt-overlay">

                <div class="auth-prompt-banner">

                    <button class="auth-prompt-close" aria-label="Close">&times;</button>

                    <h2>Sign In or Create Account</h2>

                    <p>You need to sign in or create an account to add items to your cart and checkout.</p>

                    <div class="auth-prompt-buttons">

                        <a href="login.html" class="auth-prompt-btn login-btn">

                            <i class="fas fa-sign-in-alt"></i> Sign In

                        </a>

                        <a href="signup.html" class="auth-prompt-btn signup-btn">

                            <i class="fas fa-user-plus"></i> Create Account

                        </a>

                    </div>

                </div>

            </div>

        `;

        document.body.insertAdjacentHTML('beforeend', html);

        prompt = document.getElementById('auth-prompt-modal');

       

        // Close on X button

        prompt.querySelector('.auth-prompt-close').addEventListener('click', () => {

            prompt.style.display = 'none';

        });

       

        // Close on overlay click

        prompt.addEventListener('click', (e) => {

            if (e.target === prompt) prompt.style.display = 'none';

        });

    } else {

        prompt.style.display = 'flex';

    }

}



// ================= AUTHENTICATION & ACCESS CONTROL =================
// Check if user is currently logged in (checks localStorage flag)
function isLoggedIn() {
    try {
        return !!localStorage.getItem('os_current_user');
    } catch (e) { return false; }
}



function requireLogin(returnTo) {

    try { localStorage.setItem('os_post_login_redirect', returnTo || window.location.href); } catch (e) {}

    showToast('Please sign in to continue', 900);

    setTimeout(() => {

        const url = 'login.html?return=' + encodeURIComponent(returnTo || window.location.href);

        window.location.href = url;

    }, 700);

}



function renderAuthLinks() {

    const user = localStorage.getItem('os_current_user');

    const nav = document.querySelector('.main-nav ul');

    if (!nav) return;

    const loginLink = Array.from(nav.querySelectorAll('a')).find(a => /login\.html$/.test(a.getAttribute('href')) || a.textContent.trim().toLowerCase() === 'login');

    if (user) {

        if (loginLink) {

            const li = loginLink.closest('li');

            if (li) {

                li.innerHTML = `<a href="#" id="logout-link">Logout (${escapeHtml(user)})</a>`;

                const logout = document.getElementById('logout-link');

                logout && logout.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });

            }

        } else {

            // append logout

            const li = document.createElement('li');

            li.innerHTML = `<a href="#" id="logout-link">Logout (${escapeHtml(user)})</a>`;

            nav.appendChild(li);

            document.getElementById('logout-link').addEventListener('click', (e) => { e.preventDefault(); doLogout(); });

        }

    } else {

        // ensure login link exists

        if (!loginLink) {

            const li = document.createElement('li');

            li.innerHTML = `<a href="login.html">Login</a>`;

            nav.insertBefore(li, nav.firstChild?.nextSibling || null);

        }

    }

}



function doLogout() {

    try {
        // remove auth keys
        localStorage.removeItem('os_current_user');
        localStorage.removeItem('os_saved_username');
        // clear cart and voucher on logout (use saveCart to ensure badge updates)
        try { saveCart([]); } catch (err) { localStorage.removeItem('cartItems'); }
        try { localStorage.removeItem('os_active_voucher'); } catch (err) {}
    } catch (e) {}

    // update UI badge if present
    try { updateCartCount(); } catch (e) {}

    showToast('Logged out — cart cleared');

    setTimeout(() => { window.location.href = 'index.html'; }, 700);

}



function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }



// ================= Cart Page =================

function renderCart() {

    const cart = getCartItems();

    const cartList = document.getElementById('cart-items-list');

    const cartSummaryBox = document.getElementById('cart-summary-box');

    const emptyMsg = document.getElementById('empty-cart-message');

    const headerRow = document.querySelector('.cart-header-row');

    // Debug: report element presence and cart length to console for troubleshooting
    try {
        console.debug('renderCart() status', {
            cartLength: cart.length,
            cartListExists: !!cartList,
            cartSummaryBoxExists: !!cartSummaryBox,
            emptyMsgExists: !!emptyMsg,
            headerRowExists: !!headerRow
        });
    } catch (e) { /* ignore console errors in older browsers */ }

    if (!cartList || !cartSummaryBox || !emptyMsg || !headerRow) return;



    cartList.innerHTML = '';

    if (cart.length === 0) {

        emptyMsg.style.display = 'block';

        cartSummaryBox.style.display = 'none';

        headerRow.style.display = 'none';

        return;

    }



    emptyMsg.style.display = 'none';

    cartSummaryBox.style.display = 'block';

    headerRow.style.display = 'grid';



    cart.forEach(item => {

        const itemTotal = item.price * item.quantity;

        const safeImage = item.image || 'https://via.placeholder.com/70?text=No+Image';

        const html = `

            <div class="cart-item">

                <div class="item-product-info">

                    <img src="${safeImage}" alt="${item.name}" class="item-image" onerror="this.onerror=null;this.src='https://via.placeholder.com/70?text=No+Image'">

                    <div class="item-details">

                        <p class="item-name">${item.name}</p>

                        <button class="remove-item-btn" data-id="${item.id}">\u00D7 Remove</button>

                    </div>

                </div>

                <span class="col-price item-unit-price">${formatPrice(item.price)}</span>

                <div class="col-quantity item-quantity-control">

                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.id}">

                </div>

                <span class="col-subtotal item-total">${formatPrice(itemTotal)}</span>

            </div>

        `;

        cartList.insertAdjacentHTML('beforeend', html);

    });



    const totals = calculateCartTotals(cart);

    const summaryCount = document.getElementById('summary-item-count');

    const cartSubtotalValue = document.getElementById('cart-subtotal-value');

    const cartTotalValue = document.getElementById('cart-total-value');

    if (summaryCount) summaryCount.textContent = totals.itemCount;

    if (cartSubtotalValue) cartSubtotalValue.textContent = formatPrice(totals.subtotal);

    if (cartTotalValue) cartTotalValue.textContent = formatPrice(totals.total);

    // --- Voucher UI: inject controls into cart summary if not present ---
    const cartSummary = document.getElementById('cart-summary-box');
    if (cartSummary) {
        if (!document.getElementById('voucher-controls')) {
            const voucherHtml = `
                <div id="voucher-controls" style="margin-top:10px;">
                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                        <input id="voucher-code-input" type="text" placeholder="Enter voucher code" style="padding:6px;border-radius:6px;border:1px solid #ccc;width:140px;" />
                        <button id="apply-voucher-btn" class="apply-voucher-btn" style="padding:6px 10px;border-radius:6px;background:var(--primary-color);color:#fff;border:none;">Apply</button>
                        <button id="remove-voucher-btn" class="remove-voucher-btn" style="padding:6px 10px;border-radius:6px;background:#ddd;color:#333;border:none;display:none;">Remove</button>
                    </div>
                    <div id="voucher-info" style="display:none;">Applied <strong id="voucher-code-display"></strong>: <span id="voucher-desc"></span></div>
                </div>
            `;
            cartSummary.insertAdjacentHTML('afterbegin', voucherHtml);

            // attach handlers
            const applyBtn = document.getElementById('apply-voucher-btn');
            const removeBtn = document.getElementById('remove-voucher-btn');
            const input = document.getElementById('voucher-code-input');

            applyBtn && applyBtn.addEventListener('click', () => {
                const code = input.value.trim().toUpperCase();
                if (!code) { showToast('Enter a voucher code'); return; }
                const v = getVoucherByCode(code);
                if (!v) { showToast('Invalid voucher code'); return; }
                // check min spend
                const discount = calculateVoucherDiscount(cart, code);
                if (discount <= 0) { showToast('Voucher does not meet requirements'); return; }
                setActiveVoucherCode(code);
                showToast(`Voucher ${code} applied`);
                renderCart();
            });

            removeBtn && removeBtn.addEventListener('click', () => {
                clearActiveVoucher();
                renderCart();
            });
        }

        // ensure handlers are attached to permanent voucher controls (idempotent)
        (function attachVoucherHandlers() {
            const applyBtnStatic = document.getElementById('apply-voucher-btn');
            const removeBtnStatic = document.getElementById('remove-voucher-btn');
            const inputStatic = document.getElementById('voucher-code-input');
            if (applyBtnStatic) {
                applyBtnStatic.onclick = () => {
                    const code = (inputStatic && inputStatic.value || '').trim().toUpperCase();
                    if (!code) { showToast('Enter a voucher code'); return; }
                    const v = getVoucherByCode(code);
                    if (!v) { showToast('Invalid voucher code'); return; }
                    const discount = calculateVoucherDiscount(cart, code);
                    if (discount <= 0) { showToast('Voucher does not meet requirements'); return; }
                    setActiveVoucherCode(code);
                    showToast(`Voucher ${code} applied`);
                    renderCart();
                };
            }
            if (removeBtnStatic) {
                removeBtnStatic.onclick = () => { clearActiveVoucher(); renderCart(); };
            }
        })();

        // update voucher display based on totals
        const applied = totals.appliedVoucher;
        const vRow = document.getElementById('voucher-info');
        const vCodeDisplay = document.getElementById('voucher-code-display');
        const vDesc = document.getElementById('voucher-desc');
        const vDiscountRow = document.getElementById('cart-discount-value');
        const vDiscountWrapper = document.getElementById('voucher-discount-row');
        const removeBtn = document.getElementById('remove-voucher-btn');
        const codeInput = document.getElementById('voucher-code-input');
        if (applied) {
            const v = getVoucherByCode(applied);
            if (v) {
                if (vRow) { vRow.style.display = 'block'; }
                if (vCodeDisplay) vCodeDisplay.textContent = v.code;
                if (vDesc) vDesc.textContent = v.description || '';
                if (vDiscountRow) vDiscountRow.textContent = '-' + formatPrice(totals.discount || 0);
                if (vDiscountWrapper) vDiscountWrapper.style.display = 'block';
                if (removeBtn) removeBtn.style.display = 'inline-block';
                if (codeInput) codeInput.value = v.code;
            }
        } else {
            if (vRow) vRow.style.display = 'none';
            if (vDiscountWrapper) vDiscountWrapper.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'none';
            if (codeInput) codeInput.value = '';
        }
        // update shipping display if present
        const shipElem = document.getElementById('cart-shipping-value');
        if (shipElem) shipElem.textContent = formatPrice(totals.shipping || 0);
        // ensure total updated
        const cartTotalValueElem = document.getElementById('cart-total-value');
        if (cartTotalValueElem) cartTotalValueElem.textContent = formatPrice(totals.total || 0);
    }



    // quantity change

    // Delegated handlers for quantity changes and remove buttons (attach once)
    if (cartList && !cartList.dataset.handlersAttached) {
        cartList.addEventListener('change', (e) => {
            const target = e.target;
            if (target && target.classList && target.classList.contains('quantity-input')) {
                const id = target.dataset.id;
                const qty = parseInt(target.value, 10) || 1;
                updateQuantity(id, qty);
                // re-render to update totals and UI
                renderCart();
            }
        });

        cartList.addEventListener('click', (e) => {
            const btn = e.target.closest && e.target.closest('.remove-item-btn');
            if (btn) {
                const id = btn.dataset.id;
                removeItem(id);
                renderCart();
            }
        });

        cartList.dataset.handlersAttached = '1';
    }

}



function updateQuantity(id, quantity) {

    const cart = getCartItems();

    const item = cart.find(i => i.id === id);

    if (item) item.quantity = quantity;

    saveCart(cart);

}



function removeItem(id) {

    let cart = getCartItems();

    cart = cart.filter(i => i.id !== id);

    saveCart(cart);

}



// ================= Checkout =================

function renderOrderSummary() {

    // Allow viewing checkout summary without requiring login (demo)

    const cart = getCartItems();

    const list = document.getElementById('checkout-items-list');

    if (!list) return;

    if (cart.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        window.location.href = 'catalog.html';
        return;
    }

    list.innerHTML = '';

    // helper to resolve image paths for checkout (handles absolute URLs produced by img.src)
    function resolveCheckoutImage(src) {
        const placeholder = 'https://via.placeholder.com/70?text=No+Image';
        if (!src) return placeholder;
        try {
            const u = new URL(src, window.location.href);
            // prefer a workspace-relative path (strip leading slash)
            let p = u.pathname || '';
            if (p.startsWith('/')) p = p.slice(1);
            return encodeURI(p || src);
        } catch (e) {
            return encodeURI(src);
        }
    }

    cart.forEach(item => {
        const safeImage = resolveCheckoutImage(item.image);
        const itemHtml = `
            <div class="checkout-item" data-id="${item.id}">
                <div class="checkout-thumb">
                    <img src="${encodeURI(safeImage)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/70?text=No+Image'">
                </div>
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${escapeHtml(item.name)}</div>
                    <div class="checkout-item-unit">Unit: ${formatPrice(item.price)}</div>
                </div>
                <div class="checkout-item-controls">
                    <input type="number" class="checkout-qty-input" data-id="${item.id}" value="${item.quantity}" min="1" />
                    <button class="remove-item-btn small" data-id="${item.id}">Remove</button>
                </div>
                <div class="checkout-item-total">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', itemHtml);
    });

    // Attach quantity change handlers
    document.querySelectorAll('.checkout-qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            let qty = parseInt(e.target.value, 10) || 1;
            if (qty < 1) { qty = 1; e.target.value = 1; }
            updateQuantity(id, qty);
            // update the per-item subtotal display
            const row = e.target.closest('.checkout-item');
            if (row) {
                const item = getCartItems().find(i => i.id === id);
                const lastCell = row.querySelector('div:last-child');
                if (item && lastCell) lastCell.textContent = formatPrice(item.price * item.quantity);
            }
            // update totals
            const totals = calculateCartTotals(getCartItems());
            const summaryCount = document.getElementById('summary-item-count');
            const subVal = document.getElementById('checkout-subtotal-value');
            const totVal = document.getElementById('checkout-total-value');
            if (summaryCount) summaryCount.textContent = totals.itemCount;
            if (subVal) subVal.textContent = formatPrice(totals.subtotal);
            if (totVal) totVal.textContent = formatPrice(totals.total);
        });
    });

    // Attach remove handlers
    document.querySelectorAll('.remove-item-btn.small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            removeItem(id);
            renderOrderSummary();
            updateCartCount();
        });
    });

    // update totals
    const totals = calculateCartTotals(cart);
    const summaryCount = document.getElementById('summary-item-count');
    const subVal = document.getElementById('checkout-subtotal-value');
    const totVal = document.getElementById('checkout-total-value');
    const discountVal = document.getElementById('checkout-discount-value');
    const discountRow = document.getElementById('checkout-discount-row');
    const voucherRow = document.getElementById('checkout-voucher-row');
    const voucherCode = document.getElementById('checkout-voucher-code');
    const shipVal = document.getElementById('checkout-shipping-value');

    if (summaryCount) summaryCount.textContent = totals.itemCount;
    if (subVal) subVal.textContent = formatPrice(totals.subtotal);
    if (discountVal) discountVal.textContent = formatPrice(totals.discount || 0);
    if (discountRow) discountRow.style.display = (totals.discount && totals.discount > 0) ? 'flex' : 'none';
    if (voucherRow && voucherCode) {
        if (totals.appliedVoucher) {
            voucherRow.style.display = 'flex';
            voucherCode.textContent = totals.appliedVoucher;
        } else {
            voucherRow.style.display = 'none';
            voucherCode.textContent = '-';
        }
    }
    if (shipVal) shipVal.textContent = formatPrice(totals.shipping || 0);
    if (totVal) totVal.textContent = formatPrice(totals.total);

}



function validateCheckoutForm(form) {

    let isValid = true;

    const fields = ['fullName','email','phone','address','city'];

    fields.forEach(id => {

        const input = form.querySelector(`#${id}`);

        const err = document.getElementById(`error-${id}`);

        if (input && input.value.trim() === '') {

            if (err) err.style.display = 'block';

            if (input) input.style.borderColor = '#dc3545';

            isValid = false;

        } else {

            if (err) err.style.display = 'none';

            if (input) input.style.borderColor = '#ccc';

        }

    });

    const emailInput = form.querySelector('#email');

    if (emailInput && !emailInput.value.includes('@')) {

        const emailErr = document.getElementById('error-email');

        if (emailErr) { emailErr.textContent = 'Please enter a valid email address.'; emailErr.style.display = 'block'; }

        emailInput.style.borderColor = '#dc3545';

        isValid = false;

    }

    const payment = form.querySelector('input[name="paymentMethod"]:checked');

    const payErr = document.getElementById('error-payment');

    if (!payment) { if (payErr) payErr.style.display = 'block'; isValid = false; }

    return isValid;

}



function handleCheckoutForm(event) {

    event.preventDefault();

    // require login before placing order

    if (!isLoggedIn()) { showAuthPrompt(); return; }

    const form = event.target;

    if (!validateCheckoutForm(form)) { alert('Please correct the errors in the form before placing your order.'); return; }

    const cart = getCartItems();

    const totals = calculateCartTotals(cart);

    const formData = new FormData(form);

    const customer = {};

    formData.forEach((v,k) => customer[k] = v);

    const orderNumber = 'OS' + Date.now().toString().slice(-6);

    console.log('Order placed:', { orderNumber, customer, items: cart, totals });

    localStorage.removeItem('cartItems');

    updateCartCount();

    const wrapper = document.getElementById('checkout-form-wrapper');

    if (wrapper) wrapper.style.display = 'none';

    const success = document.getElementById('order-success');

    if (success) { const num = document.getElementById('order-number'); if (num) num.textContent = orderNumber; success.style.display = 'block'; }

}



// ================= Init =================

document.addEventListener('DOMContentLoaded', () => {

    updateCartCount();

    // migrate any stored image URLs to normalized forms

    try { migrateStoredImages(); } catch (e) { /* ignore migration errors */ }

    // Setup catalog if there are product cards (works for catalog, promos, or any product page)
    if (document.querySelector('.product-card')) setupCatalog();

    if (document.getElementById('cart-items-list')) renderCart();

    if (document.getElementById('checkout-form')) {

        renderOrderSummary();

        const form = document.getElementById('checkout-form');

        form.addEventListener('submit', handleCheckoutForm);

        form.querySelectorAll('[required]').forEach(input => input.addEventListener('blur', () => validateCheckoutForm(form)));

    }



    // adjust nav/login display depending on auth state

    renderAuthLinks();



    // Add-to-cart buttons keep their normal text; auth prompt displays on click if not logged in



    // If user returned from login and a pending add-to-cart action exists, apply it now
    try {
        const pendingRaw = localStorage.getItem('os_pending_add');
        if (pendingRaw && isLoggedIn()) {
            const pending = JSON.parse(pendingRaw);
            if (pending && pending.id) {
                addItemToCart(pending);
                showToast('Added item to cart after sign-in');
                localStorage.removeItem('os_pending_add');
                if (document.getElementById('cart-items-list')) renderCart();
            }
        }
    } catch (e) { /* ignore JSON errors */ }

// ================= HEADER SCROLL ANIMATION =================
// Shrink header on scroll: adds/removes the `shrunk` class for a compact header
// When user scrolls > 100px, logo scales down and tagline becomes compact
(function setupHeaderShrink() {

        const header = document.querySelector('.main-header');

        if (!header) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let ticking = false;

        let lastScrollY = 0;

        const SHRINK_THRESHOLD = 100; // increased threshold to reduce toggle frequency



        function updateHeader() {

            const s = window.scrollY || window.pageYOffset || 0;

            const shouldShrink = s > SHRINK_THRESHOLD;

            const isShrunk = header.classList.contains('shrunk');

            

            // Only update if state changed (avoid unnecessary class toggling)

            if (shouldShrink && !isShrunk) {

                header.classList.add('shrunk');

            } else if (!shouldShrink && isShrunk) {

                header.classList.remove('shrunk');

            }

            lastScrollY = s;

            ticking = false;

        }



        function onScroll() {

            const s = window.scrollY || window.pageYOffset || 0;

            // Skip update if scroll distance is minimal (deadzone)

            if (Math.abs(s - lastScrollY) < 8 && ticking) return;

            if (prefersReduced) { updateHeader(); return; }

            if (!ticking) { window.requestAnimationFrame(updateHeader); ticking = true; }

        }



        window.addEventListener('scroll', onScroll, { passive: true });

        // Run once to set initial state if page loaded scrolled

        updateHeader();

    })();



    // header height management removed — not needed for sticky header layout



    /*

      Improve nav toggle accessibility and avoid duplicate handlers.

      This finds any `.nav-toggle` buttons and ensures they expose `aria-expanded`.

    */

    (function ensureNavToggleExists() {
        // Create hamburger button if it doesn't exist on pages missing inline creation
        // (About, Terms, Privacy, FAQ pages)
        const header = document.querySelector('.main-header');
        const nav = document.querySelector('.main-nav');
        if (!header || !nav) return;
        if (!header.querySelector('.nav-toggle')) {
            const btn = document.createElement('button');
            btn.className = 'nav-toggle';
            btn.setAttribute('aria-label', 'Toggle navigation');
            btn.innerHTML = '<span class="bar"></span>';
            const logoArea = header.querySelector('.logo-area') || header.firstElementChild;
            logoArea && logoArea.insertAdjacentElement('afterend', btn);
        }
    })();

    (function enhanceNavToggles() {
        // Enhanced nav toggle with accessibility (aria-expanded) and smooth interactions
        // Handles: toggle open/close, close on link click, close on resize, close on outside click
        const header = document.querySelector('.main-header');
        const nav = document.querySelector('.main-nav');
        if (!header || !nav) return;

        const toggles = document.querySelectorAll('.nav-toggle');

        toggles.forEach(btn => {

            if (btn.dataset.enhanced === '1') return; // skip if already enhanced

            btn.dataset.enhanced = '1';

            btn.setAttribute('aria-expanded', 'false');

            btn.setAttribute('aria-controls', 'main-navigation');

            // give the nav list an id for aria-controls (if not present)

            const list = nav.querySelector('ul');

            if (list && !list.id) list.id = 'main-navigation';



            btn.addEventListener('click', (e) => {

                const isOpen = header.classList.toggle('nav-open');

                btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

                if (isOpen) {

                    // move focus to first link for keyboard users

                    const firstLink = nav.querySelector('a');

                    if (firstLink) firstLink.focus();

                }

            });

        });

        // Close menu when clicking a nav link
        nav.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                const toggleBtn = header.querySelector('.nav-toggle');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

        // Close on resize to larger screens to avoid stuck state
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 820 && header.classList.contains('nav-open')) {
                    header.classList.remove('nav-open');
                    const toggleBtn = header.querySelector('.nav-toggle');
                    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                }
            }, 120);
        });

        // Close when clicking outside the header area
        document.addEventListener('click', (e) => {
            if (!header.contains(e.target) && header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                const toggleBtn = header.querySelector('.nav-toggle');
                if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });

    })();

});