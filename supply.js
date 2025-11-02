// Order data
let orderItems = [];
let totalAmount = 0;

// Add product to order
function addToOrder(productName, price, unit) {
    // Check if product already exists in order
    const existingItem = orderItems.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        orderItems.push({
            name: productName,
            price: price,
            unit: unit,
            quantity: 1
        });
    }
    
    updateOrderDisplay();
}

// Update order display
function updateOrderDisplay() {
    const orderItemsElement = document.getElementById('orderItems');
    const orderTotalElement = document.getElementById('orderTotal');
    const totalAmountElement = document.getElementById('totalAmount');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    // Clear current display
    orderItemsElement.innerHTML = '';
    totalAmount = 0;
    
    if (orderItems.length === 0) {
        orderItemsElement.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                <p>Your order is empty</p>
            </div>
        `;
        orderTotalElement.classList.add('hidden');
        placeOrderBtn.disabled = true;
        return;
    }
    
    // Add items to display
    orderItems.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <strong>${item.name}</strong><br>
                    <small class="text-muted">₱${item.price} / ${item.unit}</small>
                    <div class="quantity-controls mt-1">
                        <button class="btn btn-sm btn-outline-secondary quantity-btn" onclick="updateQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="form-control form-control-sm quantity-input" value="${item.quantity}" min="1" onchange="updateQuantityInput(${index}, this.value)">
                        <button class="btn btn-sm btn-outline-secondary quantity-btn" onclick="updateQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold">₱${itemTotal}</div>
                    <button class="btn btn-sm btn-outline-danger mt-1" onclick="removeFromOrder(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        orderItemsElement.appendChild(itemElement);
    });
    
    // Update total
    totalAmountElement.textContent = totalAmount.toLocaleString();
    orderTotalElement.classList.remove('hidden');
    placeOrderBtn.disabled = false;
}

// Update quantity with buttons
function updateQuantity(index, change) {
    orderItems[index].quantity += change;
    
    // Ensure quantity doesn't go below 1
    if (orderItems[index].quantity < 1) {
        orderItems[index].quantity = 1;
    }
    
    updateOrderDisplay();
}

// Update quantity with input
function updateQuantityInput(index, value) {
    const quantity = parseInt(value);
    
    if (quantity > 0) {
        orderItems[index].quantity = quantity;
        updateOrderDisplay();
    }
}

// Remove item from order
function removeFromOrder(index) {
    orderItems.splice(index, 1);
    updateOrderDisplay();
}

// Clear order
function clearOrder() {
    if (orderItems.length > 0) {
        if (confirm('Are you sure you want to clear your order?')) {
            orderItems = [];
            updateOrderDisplay();
        }
    }
}

// Place order - show modal
function placeOrder() {
    // Populate order summary in modal
    const orderSummaryElement = document.getElementById('orderSummaryItems');
    orderSummaryElement.innerHTML = '';
    
    orderItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'order-summary-item';
        itemElement.innerHTML = `
            <div class="order-item-details">
                <div class="fw-bold">${item.name}</div>
                <div class="text-muted">${item.quantity} ${item.unit} × ₱${item.price}</div>
            </div>
            <div class="order-item-price">₱${itemTotal}</div>
        `;
        
        orderSummaryElement.appendChild(itemElement);
    });
    
    // Update totals in modal
    document.getElementById('modalSubtotal').textContent = totalAmount.toLocaleString();
    document.getElementById('modalTotal').textContent = (totalAmount + 100).toLocaleString();
    
    // Show modal
    new bootstrap.Modal(document.getElementById('orderModal')).show();
}

// Save order to Firebase
async function saveOrderToFirebase(orderData) {
    try {
        const database = window.firebaseDatabase;
        const ordersRef = window.firebaseRef(database, 'orders');
        const newOrderRef = window.firebasePush(ordersRef);
        
        await window.firebaseSet(newOrderRef, {
            ...orderData,
            orderId: newOrderRef.key,
            status: 'pending',
            createdAt: new Date().toISOString(),
            timestamp: Date.now()
        });
        
        return newOrderRef.key;
    } catch (error) {
        console.error('Error saving order to Firebase:', error);
        throw error;
    }
}

// Confirm order with Firebase integration
async function confirmOrder() {
    const fullName = document.getElementById('fullName').value;
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('notes').value;
    
    // Basic validation
    if (!fullName || !address || !phone || !paymentMethod) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmOrderBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Processing...';
    confirmBtn.disabled = true;
    
    try {
        // Prepare order data
        const orderData = {
            customerInfo: {
                fullName: fullName,
                address: address,
                phone: phone
            },
            orderItems: orderItems,
            paymentMethod: paymentMethod,
            notes: notes,
            subtotal: totalAmount,
            shippingFee: 100,
            totalAmount: totalAmount + 100,
            status: 'pending',
            createdAt: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        // Save to Firebase
        const orderId = await saveOrderToFirebase(orderData);
        
        // Show success message
        alert(`✅ Order Placed Successfully!\n\nOrder ID: ${orderId}\nThank you, ${fullName}!\nYour order will be delivered to:\n${address}\n\nPayment Method: ${paymentMethod}\nTotal: ₱${(totalAmount + 100).toLocaleString()}\n\nYour order has been saved to our database.`);
        
        // Close modal and reset order
        bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
        orderItems = [];
        updateOrderDisplay();
        
        // Reset form
        document.getElementById('fullName').value = '';
        document.getElementById('address').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('paymentMethod').value = '';
        document.getElementById('notes').value = '';
        
    } catch (error) {
        alert('❌ Error placing order. Please try again.');
        console.error('Order placement error:', error);
    } finally {
        // Reset button state
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Listen for real-time order updates (for admin purposes)
function listenForOrderUpdates() {
    try {
        const database = window.firebaseDatabase;
        const ordersRef = window.firebaseRef(database, 'orders');
        
        window.firebaseOnValue(ordersRef, (snapshot) => {
            const orders = snapshot.val();
            console.log('Real-time orders update:', orders);
            
            // You can add real-time notifications here
            if (orders) {
                const orderCount = Object.keys(orders).length;
                updateOrderCounter(orderCount);
            }
        });
    } catch (error) {
        console.error('Error setting up real-time listener:', error);
    }
}

// Update order counter (optional - for display purposes)
function updateOrderCounter(count) {
    // You can display this somewhere in your admin panel
    console.log(`Total orders in system: ${count}`);
}

// Category filtering
function initializeCategoryFilter() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            // Show/hide products based on category
            const productItems = document.querySelectorAll('.product-item');
            
            productItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Show/hide category sections
            const categorySections = document.querySelectorAll('.category-section');
            
            categorySections.forEach(section => {
                if (category === 'all' || section.id === `${category}-category`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCategoryFilter();
    
    // Start listening for real-time order updates after a short delay
    // to ensure Firebase is initialized
    setTimeout(() => {
        listenForOrderUpdates();
    }, 1000);
});

// Make functions globally available
window.addToOrder = addToOrder;
window.updateQuantity = updateQuantity;
window.updateQuantityInput = updateQuantityInput;
window.removeFromOrder = removeFromOrder;
window.clearOrder = clearOrder;
window.placeOrder = placeOrder;
window.confirmOrder = confirmOrder;