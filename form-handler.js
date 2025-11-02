import { database } from './firebase-config.js';
import { ref, push, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('appointment-form');
    
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const date = document.getElementById('date').value;
            const message = document.getElementById('message').value;

            try {
                const appointmentsRef = ref(database, 'appointments');
                const newAppointmentRef = push(appointmentsRef);
                await set(newAppointmentRef, { 
                    name, 
                    email, 
                    date, 
                    message,
                    timestamp: new Date().toISOString()
                });

                alert("Appointment booked successfully!");
                form.reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('appointmentModal'));
                modal.hide();
            } catch (error) {
                console.error("Error:", error);
                alert("Something went wrong. Please try again.");
            }
        });
    }
});