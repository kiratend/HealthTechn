// Modal Management Functions
function initializeModals() {
    const modalsContainer = document.getElementById('modals-container');
    
    // Add User Modal
    modalsContainer.innerHTML = `
        <div class="modal fade" id="addUserModal" tabindex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="addUserModalLabel">Add New User</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addUserForm">
                            <div class="mb-3">
                                <label for="userName" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="userName" required>
                            </div>
                            <div class="mb-3">
                                <label for="userEmail" class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="userEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="userRole" class="form-label">Role</label>
                                <select class="form-select" id="userRole" required>
                                    <option value="">Select Role</option>
                                    <option value="admin">Administrator</option>
                                    <option value="manager">Inventory Manager</option>
                                    <option value="staff">Staff Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="userDepartment" class="form-label">Department</label>
                                <input type="text" class="form-control" id="userDepartment" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="addNewUser()">Add User</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add Supply Modal -->
        <div class="modal fade" id="addSupplyModal" tabindex="-1" aria-labelledby="addSupplyModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="addSupplyModalLabel">Add New Supply</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addSupplyForm">
                            <div class="mb-3">
                                <label for="supplyName" class="form-label">Supply Name</label>
                                <input type="text" class="form-control" id="supplyName" required>
                            </div>
                            <div class="mb-3">
                                <label for="supplyStock" class="form-label">Initial Stock</label>
                                <input type="number" class="form-control" id="supplyStock" min="0" required>
                            </div>
                            <div class="mb-3">
                                <label for="supplyCategory" class="form-label">Category</label>
                                <select class="form-select" id="supplyCategory" required>
                                    <option value="">Select Category</option>
                                    <option value="protective">Protective Equipment</option>
                                    <option value="medical">Medical Supplies</option>
                                    <option value="surgical">Surgical Instruments</option>
                                    <option value="pharmaceutical">Pharmaceuticals</option>
                                    <option value="diagnostic">Diagnostic Tools</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-success" onclick="submitNewSupply()">Add Supply</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Place Order Modal -->
        <div class="modal fade" id="placeOrderModal" tabindex="-1" aria-labelledby="placeOrderModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title" id="placeOrderModalLabel">Place New Order</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="placeOrderForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="orderSupplier" class="form-label">Supplier</label>
                                    <select class="form-select" id="orderSupplier" required>
                                        <option value="">Select Supplier</option>
                                        <option value="medsupply">MedSupply Inc.</option>
                                        <option value="globalmed">Global Medical Supplies</option>
                                        <option value="healthpro">HealthPro Distributors</option>
                                        <option value="surgitools">Surgical Tools Co.</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="orderPriority" class="form-label">Priority</label>
                                    <select class="form-select" id="orderPriority" required>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Select Items</label>
                                <div id="orderItemsList">
                                    <!-- Items will be populated dynamically -->
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-warning" onclick="submitNewOrder()">Place Order</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Modal Control Functions
function openAddUserModal() {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
}

function openAddSupplyModal() {
    const modal = new bootstrap.Modal(document.getElementById('addSupplyModal'));
    modal.show();
}

function openPlaceOrderModal() {
    const modal = new bootstrap.Modal(document.getElementById('placeOrderModal'));
    modal.show();
}

// Make modal functions available globally
window.initializeModals = initializeModals;
window.openAddUserModal = openAddUserModal;
window.openAddSupplyModal = openAddSupplyModal;
window.openPlaceOrderModal = openPlaceOrderModal;