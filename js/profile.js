// Profile Management System
const profileKey = 'nisarga_user_profile';

const defaultProfile = {
    username: 'Guest',
    email: 'Not logged in',
    phone: 'None',
    isGuest: true
};

function loadProfile() {
    const saved = localStorage.getItem(profileKey);
    return saved ? JSON.parse(saved) : defaultProfile;
}

function saveProfile(profileData) {
    localStorage.setItem(profileKey, JSON.stringify({ ...profileData, isGuest: false }));
    updateUI();
    updateNavbar();
}

function updateUI() {
    const profile = loadProfile();
    
    const elements = {
        name: document.getElementById('displayName'),
        email: document.getElementById('displayEmail'),
        phone: document.getElementById('displayPhone'),
        avatar: document.getElementById('displayAvatar'),
        status: document.getElementById('userStatus')
    };

    if (elements.name) elements.name.textContent = profile.username;
    if (elements.email) elements.email.textContent = profile.email;
    if (elements.phone) elements.phone.textContent = profile.phone;
    if (elements.status) elements.status.textContent = profile.isGuest ? 'Guest User' : 'Premium Customer';
    
    if (elements.avatar) {
        const initials = profile.username.split(' ').map(n => n[0]).join('').toUpperCase();
        elements.avatar.textContent = initials.substring(0, 2);
        // Change background based on guest status
        // Guests: blue (default/neutral), Logged-in: cyan gradient (premium feel)
        elements.avatar.style.background = profile.isGuest 
            ? 'var(--primary-blue)' 
            : 'linear-gradient(135deg, var(--accent-cyan), #00a8ff)';
    }

    renderOrderHistory();
}

function renderOrderHistory() {
    const orderList = document.getElementById('orderHistoryList');
    if (!orderList) return;

    const orders = JSON.parse(localStorage.getItem('nisarga_orders') || '[]');

    if (orders.length === 0) {
        orderList.innerHTML = `
            <div class="empty-orders" style="text-align: center; padding: 40px 0; color: rgba(255,255,255,0.4);">
                <p>No orders placed yet.</p>
                <a href="order.html" class="btn btn-outline" style="margin-top: 20px; display: inline-block;">Order Now</a>
            </div>
        `;
        return;
    }

    orderList.innerHTML = orders.map(order => `
        <div class="history-item">
            <div>
                <h4>Order #${order.id}</h4>
                <small style="color: rgba(255,255,255,0.4);">${order.date} • ${order.qty} Can${order.qty > 1 ? 's' : ''}</small>
            </div>
            <div>
                <span class="status-badge">${order.status}</span>
                <p style="margin-top: 8px;">₹${order.total}</p>
            </div>
        </div>
    `).join('');
}

function updateNavbar() {
    const profile = loadProfile();
    const navProfileLink = document.querySelector('a[href="profile.html"]');
    if (navProfileLink) {
        navProfileLink.textContent = profile.isGuest ? 'My Profile' : profile.username;
    }
}

// Form Handling
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    updateNavbar();

    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const profileForm = document.getElementById('profileForm');
    const formContainer = document.getElementById('profileFormContainer');
    const displayContainer = document.getElementById('profileDisplayContainer');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const profile = loadProfile();
            document.getElementById('editUsername').value = profile.isGuest ? '' : profile.username;
            document.getElementById('editEmail').value = profile.isGuest ? '' : profile.email;
            document.getElementById('editPhone').value = profile.isGuest ? '' : profile.phone;
            
            displayContainer.style.display = 'none';
            formContainer.style.display = 'block';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            formContainer.style.display = 'none';
            displayContainer.style.display = 'block';
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newProfile = {
                username: document.getElementById('editUsername').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value
            };
            saveProfile(newProfile);
            formContainer.style.display = 'none';
            displayContainer.style.display = 'block';
            alert('Profile updated successfully!');
        });
    }
});
