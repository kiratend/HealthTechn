// firebase-supply.js

import { database, ref, set } from "./firebase-config.js";

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('medventory_cart')) || [];

// ✅ Make functions available to HTML buttons
window.addToOrder = addToOrder;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearOrder = clearOrder;
window.placeOrder = placeOrder;
window.confirmOrder = confirmOrder;

// Add item to cart
function addToOrder(name, price, unit) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ name, price, unit, quantity: 1 });
    }
    localStorage.setItem('medventory_cart', JSON.stringify(cart));
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    const orderItems = document.getElementById('orderItems');
    const totalAmount = document.getElementById('totalAmount');
    const orderTotal = document.getElementById('orderTotal');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    if (cart.length === 0) {
        orderItems.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                <p>Your order is empty</p>
            </div>`;
        orderTotal.classList.add('hidden');
        placeOrderBtn.disabled = true;
        return;
    }

    let total = 0;
    let html = '';
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="order-item">
                <div class="d-flex justify-content-between">
                    <strong>${item.name}</strong>
                    <span>₱${itemTotal}</span>
                </div>
                <div>
                    <button onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity} ${item.unit}</span>
                    <button onclick="updateQuantity(${index}, 1)">+</button>
                    <button onclick="removeFromCart(${index})">🗑</button>
                </div>
            </div>
        `;
    });

    orderItems.innerHTML = html;
    totalAmount.textContent = total.toLocaleString();
    orderTotal.classList.remove('hidden');
    placeOrderBtn.disabled = false;
}

// Update item quantity
function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    localStorage.setItem('medventory_cart', JSON.stringify(cart));
    updateCartUI();
}

// Remove from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('medventory_cart', JSON.stringify(cart));
    updateCartUI();
}

// Clear cart
function clearOrder() {
    cart = [];
    localStorage.removeItem('medventory_cart');
    updateCartUI();
}

// Show modal
function placeOrder() {
    if (cart.length === 0) return;
    updateOrderModal();
    let modal = new bootstrap.Modal(document.getElementById('orderModal'));
    modal.show();
}

// Fill modal summary
function updateOrderModal() {
    let subtotal = 0;
    let html = "";
    cart.forEach(item => {
        const total = item.price * item.quantity;
        subtotal += total;
        html += `<div class="d-flex justify-content-between">
            <span>${item.name} (${item.quantity}x ₱${item.price})</span>
            <span>₱${total}</span>
        </div>`;
    });
    document.getElementById('orderSummaryItems').innerHTML = html;
    document.getElementById('modalSubtotal').textContent = subtotal.toLocaleString();
    document.getElementById('modalTotal').textContent = (subtotal + 100).toLocaleString();
}

// ✅ Final save to Firebase
async function confirmOrder() {
    const fullName = document.getElementById('fullName').value;
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!fullName || !address || !phone || !paymentMethod) {
        alert("Please fill all required fields");
        return;
    }

    const orderId = 'ORD' + Date.now();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        orderId,
        customerInfo: { fullName, address, phone },
        items: cart,
        payment: { method: paymentMethod, subtotal, shipping: 100, total: subtotal + 100 },
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    try {
        await set(ref(database, 'orders/' + orderId), orderData);
        alert("Order placed successfully! Order ID: " + orderId);
        cart = [];
        localStorage.removeItem('medventory_cart');
        updateCartUI();
        bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
    } catch (error) {
        console.error(error);
        alert("Failed to place order.");
    }
}

// Auto-update when page loads
document.addEventListener('DOMContentLoaded', updateCartUI);
