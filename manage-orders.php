<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Manage Orders - MedVentory</title>

  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />

  <!-- Font Awesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

  <style>
    body {
      background-color: #f4f8fb;
    }

    .navbar {
      background-color: #198754;
    }

    .navbar-brand, .nav-link {
      color: white !important;
    }

    .page-header {
      text-align: center;
      padding: 40px 0;
      background-color: #198754;
      color: white;
    }

    .order-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .footer {
      background-color: #198754;
      color: white;
      text-align: center;
      padding: 15px;
      margin-top: 40px;
    }

    .status-pending {
      color: orange;
    }

    .status-delivered {
      color: green;
    }

    .status-cancelled {
      color: red;
    }

    .btn-back {
      background-color: #198754;
      color: white;
      border: none;
    }

    .btn-back:hover {
      background-color: #157347;
    }
    
    /* Toast notification styling */
    #toastContainer {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1050;
    }
    
    .toast {
      transition: opacity 0.3s ease;
    }
  </style>
</head>
<body>

  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-dark">
    <div class="container">
      <a class="navbar-brand" href="index.html">
        <i class="fas fa-stethoscope me-2"></i>MedVentory
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>
  </nav>

  <!-- Header -->
  <div class="page-header">
    <h1><i class="fas fa-clipboard-list me-2"></i>Manage Orders</h1>
    <p>Review, update, or cancel supply orders</p>
  </div>

  <!-- Toast container for notifications -->
  <div id="toastContainer"></div>

  <!-- Orders Table -->
  <div class="container mt-4">
    <div class="order-card">
      <div class="table-responsive">
        <table class="table table-bordered align-middle">
          <thead class="table-success">
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="ordersTableBody">
            <tr id="order-001">
              <td>001</td>
              <td>Masks</td>
              <td>200</td>
              <td>Clinic A</td>
              <td><span class="status-pending"><i class="fas fa-clock me-1"></i>Pending</span></td>
              <td>
                <button class="btn btn-success btn-sm mark-delivered" data-order-id="001"><i class="fas fa-check-circle me-1"></i>Mark as Delivered</button>
                <button class="btn btn-danger btn-sm cancel-order" data-order-id="001"><i class="fas fa-times-circle me-1"></i>Cancel</button>
              </td>
            </tr>
            <tr id="order-002">
              <td>002</td>
              <td>Gloves</td>
              <td>150</td>
              <td>Clinic B</td>
              <td><span class="status-delivered"><i class="fas fa-check me-1"></i>Delivered</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" disabled><i class="fas fa-ban me-1"></i>Closed</button>
              </td>
            </tr>
            <tr id="order-003">
              <td>003</td>
              <td>Sanitizers</td>
              <td>100</td>
              <td>Clinic C</td>
              <td><span class="status-cancelled"><i class="fas fa-times me-1"></i>Cancelled</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" disabled><i class="fas fa-ban me-1"></i>Closed</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Back Button -->
    <div class="text-end">
      <a href="admin.html" class="btn btn-back"><i class="fas fa-arrow-left me-2"></i>Back to Dashboard</a>
    </div>
  </div>

  <!-- Footer -->
  <footer class="footer">
    <p>&copy; 2025 MedVentory. All Rights Reserved.</p>
  </footer>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- Custom JavaScript -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Function to show toast notifications
      function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = 'toast-' + Date.now();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
          <div class="d-flex">
            <div class="toast-body">
              ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
          autohide: true,
          delay: 3000
        });
        
        bsToast.show();
        
        // Remove the toast from DOM after it's hidden
        toast.addEventListener('hidden.bs.toast', function() {
          toast.remove();
        });
      }
      
      // Function to update order status
      function updateOrderStatus(orderId, newStatus) {
        const orderRow = document.getElementById(`order-${orderId}`);
        if (!orderRow) return;
        
        const statusCell = orderRow.cells[4];
        const actionCell = orderRow.cells[5];
        
        // Update status
        let statusClass, statusIcon, statusText;
        
        switch(newStatus) {
          case 'delivered':
            statusClass = 'status-delivered';
            statusIcon = 'fa-check';
            statusText = 'Delivered';
            break;
          case 'cancelled':
            statusClass = 'status-cancelled';
            statusIcon = 'fa-times';
            statusText = 'Cancelled';
            break;
          default:
            statusClass = 'status-pending';
            statusIcon = 'fa-clock';
            statusText = 'Pending';
        }
        
        statusCell.innerHTML = `<span class="${statusClass}"><i class="fas ${statusIcon} me-1"></i>${statusText}</span>`;
        
        // Update actions
        if (newStatus === 'delivered' || newStatus === 'cancelled') {
          actionCell.innerHTML = '<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-ban me-1"></i>Closed</button>';
        } else {
          actionCell.innerHTML = `
            <button class="btn btn-success btn-sm mark-delivered" data-order-id="${orderId}"><i class="fas fa-check-circle me-1"></i>Mark as Delivered</button>
            <button class="btn btn-danger btn-sm cancel-order" data-order-id="${orderId}"><i class="fas fa-times-circle me-1"></i>Cancel</button>
          `;
          
          // Reattach event listeners to the new buttons
          attachEventListeners();
        }
      }
      
      // Function to handle marking as delivered
      function markAsDelivered(orderId) {
        // In a real application, you would make an API call here
        // For this demo, we'll just update the UI
        
        updateOrderStatus(orderId, 'delivered');
        showToast(`Order #${orderId} marked as delivered.`, 'success');
      }
      
      // Function to handle order cancellation
      function cancelOrder(orderId) {
        // In a real application, you would make an API call here
        // For this demo, we'll just update the UI
        
        updateOrderStatus(orderId, 'cancelled');
        showToast(`Order #${orderId} has been cancelled.`, 'danger');
      }
      
      // Function to show confirmation dialog
      function showConfirmationDialog(message, confirmCallback) {
        // Create a Bootstrap modal for confirmation
        const modalId = 'confirmationModal-' + Date.now();
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = -1;
        modal.setAttribute('aria-labelledby', `${modalId}Label`);
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="${modalId}Label">Confirm Action</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                ${message}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="${modalId}-confirm">Confirm</button>
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Set up confirm button event listener
        document.getElementById(`${modalId}-confirm`).addEventListener('click', function() {
          confirmCallback();
          bsModal.hide();
        });
        
        // Remove the modal from DOM when hidden
        modal.addEventListener('hidden.bs.modal', function() {
          modal.remove();
        });
      }
      
      // Function to attach event listeners to action buttons
      function attachEventListeners() {
        // Mark as delivered buttons
        document.querySelectorAll('.mark-delivered').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            showConfirmationDialog(
              `Are you sure you want to mark order #${orderId} as delivered?`,
              () => markAsDelivered(orderId)
            );
          });
        });
        
        // Cancel order buttons
        document.querySelectorAll('.cancel-order').forEach(button => {
          button.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            showConfirmationDialog(
              `Are you sure you want to cancel order #${orderId}?`,
              () => cancelOrder(orderId)
            );
          });
        });
      }
      
      // Initialize event listeners
      attachEventListeners();
    });
  </script>
</body>
</html>