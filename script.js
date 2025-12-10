/*
 Simple site JavaScript (plain English explanation):

 This file contains the small pieces of JavaScript that make the website feel "alive":
 - Functions to read and write the shopping cart to your browser (localStorage).
 - Helpers to format money, keep the little cart number updated, and show tiny messages.
 - Code to make the catalog's "Add to cart" buttons work.
 - Code to render the cart page and the checkout summary.
 - A small header shrink-on-scroll feature to make the top bar smaller when you scroll down.

 Think of this file as the site's "helper brain" — it doesn't talk to a server, it just
 remembers the cart in your browser and updates the page accordingly.
*/

// ================= Cart Helper Functions ================
const SHIPPING_FEE = 150.00;

function formatPrice(price) {
    return `₱ ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function getCartItems() {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (!cartCountElement) return;
    cartCountElement.textContent = totalItems > 99 ? '99+' : totalItems;
    cartCountElement.setAttribute('data-count', totalItems);
}

function addItemToCart(newItem) {
    const cart = getCartItems();
    const existing = cart.find(i => i.id === newItem.id);
    if (existing) {
        existing.quantity += newItem.quantity;
    } else {
        // Normalize image URL before saving
        if (newItem.image) newItem.image = normalizeImageUrl(newItem.image);
        cart.push(newItem);
    }
    saveCart(cart);
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
    const total = subtotal > 0 ? subtotal + SHIPPING_FEE : 0;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, total, itemCount };
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

// ================= Catalog =================
function setupCatalog() {
    updateCartCount();
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

            addItemToCart({ id, name, price, image, quantity: 1 });

            // Show prompt exactly as requested
            showToast('added to card!');

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

// ================= Cart Page =================
function renderCart() {
    const cart = getCartItems();
    const cartList = document.getElementById('cart-list');
    const cartSummaryBox = document.getElementById('cart-summary-box');
    const emptyMsg = document.getElementById('empty-cart-message');
    const headerRow = document.getElementById('cart-header-row');
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

    // quantity change
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const qty = parseInt(e.target.value) || 1;
            updateQuantity(id, qty);
            renderCart();
        });
    });

    // remove
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            removeItem(id);
            renderCart();
        });
    });
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
    const cart = getCartItems();
    const list = document.getElementById('checkout-items-list');
    if (!list) return;
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        window.location.href = 'catalog.html';
        return;
    }
    list.innerHTML = '';
    cart.forEach(item => {
        const html = `<div class="checkout-item"><span>${item.name} (x${item.quantity})</span><span>${formatPrice(item.price * item.quantity)}</span></div>`;
        list.insertAdjacentHTML('beforeend', html);
    });
    const totals = calculateCartTotals(cart);
    const summaryCount = document.getElementById('summary-item-count');
    const subVal = document.getElementById('checkout-subtotal-value');
    const totVal = document.getElementById('checkout-total-value');
    if (summaryCount) summaryCount.textContent = totals.itemCount;
    if (subVal) subVal.textContent = formatPrice(totals.subtotal);
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
    if (document.querySelector('.product-catalog')) setupCatalog();
    if (document.getElementById('cart-list')) renderCart();
    if (document.getElementById('checkout-form')) {
        renderOrderSummary();
        const form = document.getElementById('checkout-form');
        form.addEventListener('submit', handleCheckoutForm);
        form.querySelectorAll('[required]').forEach(input => input.addEventListener('blur', () => validateCheckoutForm(form)));
    }

    // Shrink header on scroll: adds/removes the `shrunk` class for a compact header
    (function setupHeaderShrink() {
        const header = document.querySelector('.main-header');
        if (!header) return;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let ticking = false;

        function updateHeader() {
            const s = window.scrollY || window.pageYOffset || 0;
            if (s > 60) header.classList.add('shrunk'); else header.classList.remove('shrunk');
            ticking = false;
        }

        function onScroll() {
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
    (function enhanceNavToggles() {
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
    })();
});
