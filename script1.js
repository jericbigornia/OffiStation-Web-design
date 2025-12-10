// ================= Cart Helper Functions ================
const SHIPPING_FEE = 150.00;

function formatPrice(price) {
    return `₱ ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

// Retrieve cart items from localStorage
function getCartItems() {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

// Save cart items to localStorage and update cart count badge
function saveCart(cart) {
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count badge in header
function updateCartCount() {
    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');

    if (cartCountElement) {
        cartCountElement.textContent = totalItems > 99 ? '99+' : totalItems;
        cartCountElement.setAttribute('data-count', totalItems);
    }
}

// Add item to cart (with quantity increment)
function addItemToCart(newItem) {
    let cart = getCartItems();
    const existingItem = cart.find(item => item.id === newItem.id);

    if (existingItem) {
        existingItem.quantity += newItem.quantity;
    } else {
        cart.push(newItem);
    }
    saveCart(cart);
}

// Calculate subtotal, total, and total quantity
function calculateCartTotals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal > 0 ? subtotal + SHIPPING_FEE : 0;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, total, itemCount };
}

// ================== Catalog Page Logic ===================
function setupCatalog() {
    updateCartCount();
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            
            // Safety check: ensure productCard is found
            if (!productCard) {
                console.error("Product card not found for this button.");
                return;
            }

            const id = productCard.dataset.id;
            const name = productCard.dataset.name;
            const price = parseFloat(productCard.dataset.price.replace(/,/g, '')); 
            const image = productCard.dataset.image;

            addItemToCart({ id, name, price, image, quantity: 1 });

            // Visual feedback for the user
            e.target.textContent = 'Added!';
            e.target.disabled = true;
            setTimeout(() => {
                e.target.textContent = 'Add to cart';
                e.target.disabled = false;
            }, 800);
        });
    });
}

// ================== Cart Page Logic =======================
function renderCart() {
    const cart = getCartItems();
    const cartListElement = document.getElementById('cart-list');
    const cartSummaryBox = document.getElementById('cart-summary-box');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartHeaderRow = document.getElementById('cart-header-row');
    const summaryItemCountElement = document.getElementById('summary-item-count');
    const cartSubtotalValue = document.getElementById('cart-subtotal-value');
    const cartTotalValue = document.getElementById('cart-total-value');


    if (!cartListElement || !cartSummaryBox || !emptyCartMessage || !cartHeaderRow) return;

    cartListElement.innerHTML = '';

    if (cart.length === 0) {
        emptyCartMessage.style.display = 'block';
        cartSummaryBox.style.display = 'none';
        cartHeaderRow.style.display = 'none';
        return;
    }

    emptyCartMessage.style.display = 'none';
    cartSummaryBox.style.display = 'block';
    cartHeaderRow.style.display = 'grid';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const itemHtml = `
            <div class="cart-item">
                <div class="item-product-info">
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                    <div class="item-details">
                        <p class="item-name">${item.name}</p>
                        <button class="remove-item-btn" data-id="${item.id}"><i class="fas fa-times"></i> Remove</button>
                    </div>
                </div>
                <span class="col-price item-unit-price">${formatPrice(item.price)}</span>
                <div class="col-quantity item-quantity-control">
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" data-id="${item.id}">
                </div>
                <span class="col-subtotal item-total">${formatPrice(itemTotal)}</span>
            </div>
        `;
        cartListElement.insertAdjacentHTML('beforeend', itemHtml);
    });

    const totals = calculateCartTotals(cart);
    summaryItemCountElement.textContent = totals.itemCount;
    cartSubtotalValue.textContent = formatPrice(totals.subtotal);
    cartTotalValue.textContent = formatPrice(totals.total);

    // Quantity input event listeners
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const newQty = parseInt(e.target.value);
            if (newQty > 0) {
                updateQuantity(id, newQty);
            } else {
                removeItem(id);
            }
        });
    });

    // Remove item buttons event listeners
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Find the closest parent element with the data-id
            const id = e.target.closest('.remove-item-btn').dataset.id; 
            removeItem(id);
        });
    });
}

function updateQuantity(id, quantity) {
    let cart = getCartItems();
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = quantity;
    }
    saveCart(cart);
}

function removeItem(id) {
    let cart = getCartItems();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
    // Re-render immediately to update list visibility if it's the last item
    renderCart(); 
}

// ================== Checkout Page Logic ===================
function renderOrderSummary() {
    const cart = getCartItems();
    const checkoutItemsList = document.getElementById('checkout-items-list');
    const checkoutSubtotalValue = document.getElementById('checkout-subtotal-value');
    const checkoutTotalValue = document.getElementById('checkout-total-value');
    const summaryItemCountElement = document.getElementById('summary-item-count');

    if (!checkoutItemsList) return;

    if (cart.length === 0) {
        alert("Your cart is empty. Please add items before checking out.");
        window.location.href = "catalog.html";
        return;
    }

    checkoutItemsList.innerHTML = '';
    cart.forEach(item => {
        const itemHtml = `
            <div class="checkout-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>`;
        checkoutItemsList.insertAdjacentHTML('beforeend', itemHtml);
    });

    const totals = calculateCartTotals(cart);
    summaryItemCountElement.textContent = totals.itemCount;
    checkoutSubtotalValue.textContent = formatPrice(totals.subtotal);
    checkoutTotalValue.textContent = formatPrice(totals.total);
}

function validateCheckoutForm(form) {
    let isValid = true;

    // Validate text/input fields
    const fields = ['fullName', 'email', 'phone', 'address', 'city'];
    fields.forEach(id => {
        const input = form.querySelector(`#${id}`);
        const errorElem = document.getElementById(`error-${id}`);
        if (input && input.value.trim() === '') {
            if (errorElem) errorElem.style.display = 'block';
            input.style.borderColor = '#dc3545'; // Highlight error
            isValid = false;
        } else {
            if (errorElem) errorElem.style.display = 'none';
            input.style.borderColor = '#ccc';
        }
    });

    // Email validation
    const emailInput = form.querySelector('#email');
    const emailErr = document.getElementById('error-email');
    if (emailInput && !emailInput.value.includes('@')) {
        if (emailErr) {
            emailErr.textContent = 'Please enter a valid email address.';
            emailErr.style.display = 'block';
        }
        emailInput.style.borderColor = '#dc3545';
        isValid = false;
    }

    // Payment method validation
    const payment = form.querySelector('input[name="paymentMethod"]:checked');
    const paymentError = document.getElementById('error-payment');
    if (!payment) {
        if (paymentError) paymentError.style.display = 'block';
        isValid = false;
    } else if (paymentError) {
        paymentError.style.display = 'none';
    }

    return isValid;
}

function handleCheckoutForm(event) {
    event.preventDefault();
    const form = event.target;

    if (!validateCheckoutForm(form)) {
        alert('Please correct the errors in the form before placing your order.');
        return;
    }

    const cart = getCartItems();
    const totals = calculateCartTotals(cart);
    const formData = new FormData(form);
    const customerInfo = {};
    formData.forEach((value, key) => customerInfo[key] = value);

    const orderNumber = 'OS' + Date.now().toString().slice(-6);

    // Simulating order placement (logging to console)
    console.log('Order placed:', {
        orderNumber,
        customer: customerInfo,
        items: cart,
        totals,
        timestamp: new Date().toLocaleString()
    });

    // Final Steps
    localStorage.removeItem('cartItems');
    updateCartCount();

    // Hide the form and show success message
    document.getElementById('checkout-form-wrapper').style.display = 'none';
    const successMsg = document.getElementById('order-success');
    if (successMsg) {
        document.getElementById('order-number').textContent = orderNumber;
        successMsg.style.display = 'block';
    }

    window.scrollTo(0, 0);
}

// =============== Initialize based on page (FIXED) ================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Always update the cart count first
    updateCartCount();

    // 2. Check for page-specific elements to initialize the right function
    if (document.getElementById('cart-list')) {
        renderCart();
    }

    // FIX: Check for the catalog section or the product grid to confirm we are on the catalog page.
    // The previous check might have run too early.
    if (document.querySelector('.product-catalog')) {
        setupCatalog();
    }

    if (document.getElementById('checkout-form')) {
        renderOrderSummary();
        const form = document.getElementById('checkout-form');
        form.addEventListener('submit', handleCheckoutForm);
        // Real-time validation feedback
        form.querySelectorAll('[required]').forEach(input => {
            input.addEventListener('blur', () => validateCheckoutForm(form));
        });
    }
});