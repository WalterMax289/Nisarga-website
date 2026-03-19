// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Smooth Scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Global User Navbar Logic
function updateGlobalNavbar() {
    const saved = localStorage.getItem('nisarga_user_profile');
    if (saved) {
        const profile = JSON.parse(saved);
        const navProfileLink = document.querySelector('a[href="profile.html"]');
        if (navProfileLink && !profile.isGuest) {
            navProfileLink.textContent = profile.username;
        }
    }
}

// Scroll to Top Logic
const scrollTopBtn = document.createElement('button');
scrollTopBtn.classList.add('scroll-top');
scrollTopBtn.innerHTML = '↑';
document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

document.addEventListener('DOMContentLoaded', updateGlobalNavbar);
