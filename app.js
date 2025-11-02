// Main application logic
class MedVentoryApp {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeComponents();
    }

    bindEvents() {
        // Add any global event listeners here
        console.log('MedVentory App Initialized');
    }

    initializeComponents() {
        // Initialize any components that need JavaScript
        this.initializeModalListeners();
    }

    initializeModalListeners() {
        // Additional modal functionality if needed
        const appointmentModal = document.getElementById('appointmentModal');
        if (appointmentModal) {
            appointmentModal.addEventListener('show.bs.modal', function () {
                console.log('Appointment modal opened');
            });
        }
    }

    // Utility methods
    showNotification(message, type = 'success') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.medVentoryApp = new MedVentoryApp();
});