// ✅ Firebase (same version as login)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { 
    getDatabase, ref, get, set, update, remove, onValue, push, query, orderByChild, equalTo, limitToLast 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCTfRRVc-QRKpEpzIpe3OtI2cYeotP1WCs",
  authDomain: "healthtechn-c15da.firebaseapp.com",
  databaseURL: "https://healthtechn-c15da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtechn-c15da",
  storageBucket: "healthtechn-c15da.appspot.com",
  messagingSenderId: "508561693923",
  appId: "1:508561693923:web:d5ce35934eded8ff50f9d6"
};

// ✅ Init Firebase Services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

let currentUser = null;

// =======================================================
// ✅ AUTH + ROLE CHECK
// =======================================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Session expired. Please login again.");
        return window.location.href = "login.html";
    }

    const snapshot = await get(ref(database, "users/" + user.uid));

    if (!snapshot.exists()) {
        alert("User record not found. Contact admin.");
        await signOut(auth);
        return window.location.href = "login.html";
    }

    const userData = snapshot.val();
    currentUser = userData;

    if ((userData.role || "").toLowerCase() !== "admin") {
        alert("Access restricted to Admins only.");
        await signOut(auth);
        return window.location.href = "login.html";
    }

    console.log("✅ Admin logged in:", userData.email);

    loadDashboardData();
    loadUsers();
    loadOrders();
    loadNotifications();
});

// =======================================================
// ✅ DASHBOARD FUNCTIONS
// =======================================================
function loadDashboardData() {
    // Total Supplies
    onValue(ref(database, "supplies"), (snapshot) => {
        const data = snapshot.val();
        document.getElementById("total-supplies").textContent = data ? Object.keys(data).length : 0;
    });

    // Pending Orders
    onValue(query(ref(database, "orders"), orderByChild("status"), equalTo("pending")), (snapshot) => {
        const data = snapshot.val();
        document.getElementById("orders-pending").textContent = data ? Object.keys(data).length : 0;
    });

    // Low Stock Items
    onValue(ref(database, "supplies"), (snapshot) => {
        const data = snapshot.val();
        let count = 0;
        if (data) {
            Object.values(data).forEach((item) => {
                if (item.quantity < item.minQuantity) count++;
            });
        }
        document.getElementById("low-stock").textContent = count;
    });

    // Total Users
    onValue(ref(database, "users"), (snapshot) => {
        const data = snapshot.val();
        document.getElementById("total-users").textContent = data ? Object.keys(data).length : 0;
    });
}

// =======================================================
// ✅ LOAD USERS
// =======================================================
function loadUsers() {
    onValue(ref(database, "users"), (snapshot) => {
        const users = snapshot.val();
        const table = document.getElementById("user-list");
        table.innerHTML = "";

        if (!users) return table.innerHTML = 
            `<tr><td colspan="5" class="text-center">No users found</td></tr>`;

        Object.keys(users).forEach(uid => {
            const u = users[uid];

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td><span class="badge ${u.status === "active" ? "bg-success" : "bg-secondary"}">${u.status}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="editUser('${uid}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${uid}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            table.appendChild(row);
        });
    });
}

// =======================================================
// ✅ SAVE USER (Admin creating new account)
// =======================================================
window.saveUser = async function () {
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const password = document.getElementById('userPassword').value;

    if (!email || !role || !password) return alert("Complete all fields!");

    const newRef = push(ref(database, "users"));
    await set(newRef, {
        email, role, status,
        createdAt: Date.now(),
        createdBy: currentUser.email
    });

    alert("✅ User added (Tell them password manually)");
    document.getElementById("addUserForm").reset();
    bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
};

// =======================================================
// ✅ DELETE USER
// =======================================================
window.deleteUser = async function(uid) {
    if (!confirm("Delete this user?")) return;
    await remove(ref(database, "users/" + uid));
    alert("User deleted");
};

// =======================================================
// ✅ LOAD ORDERS
// =======================================================
function loadOrders() {
    onValue(query(ref(database, "orders"), orderByChild("orderDate"), limitToLast(20)), (snapshot) => {
        const orders = snapshot.val();
        const table = document.getElementById("all-orders-list");
        table.innerHTML = "";

        if (!orders) return table.innerHTML = `<tr><td colspan="7">No orders</td></tr>`;

        Object.keys(orders).forEach(id => {
            const o = orders[id];
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${id}</td>
                <td>${o.supplier}</td>
                <td>${o.items?.join(", ")}</td>
                <td>${o.orderDate}</td>
                <td>${o.deliveryDate || "Pending"}</td>
                <td><span class="badge bg-${o.status=="delivered"?"success":"warning"}">${o.status}</span></td>
                <td><button class="btn btn-sm btn-outline-success" onclick="markDelivered('${id}')"><i class="fas fa-check"></i></button></td>
            `;
            table.appendChild(row);
        });
    });
}

window.markDelivered = (id) => {
    update(ref(database, "orders/" + id), { status: "delivered" });
};

// =======================================================
// ✅ NOTIFICATIONS
// =======================================================
function loadNotifications() {
    onValue(query(ref(database, "notifications"), limitToLast(5)), (snapshot) => {
        const notifs = snapshot.val();
        const list = document.getElementById("notification-list");
        const countBadge = document.getElementById("notification-count");

        list.innerHTML = "";
        let unread = 0;

        if (notifs) {
            Object.entries(notifs).forEach(([id, n]) => {
                if (!n.read) unread++;
                const li = document.createElement("li");
                li.className = "dropdown-item";
                li.textContent = n.message;
                li.onclick = () => markRead(id);
                list.appendChild(li);
            });
        }

        countBadge.textContent = unread;
    });
}

window.markRead = (id) => update(ref(database, "notifications/" + id), { read: true });

// =======================================================
// ✅ LOGOUT
// =======================================================
document.getElementById("logout-link").addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "login.html";
});
