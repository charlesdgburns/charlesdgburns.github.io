// Navigation items for randomization
const navItems = [
    { text: 'About', href: './about/' },
    { text: 'Academia', href: './academia/' },
    { text: 'Art', href: './art/' }
];

// Function to shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Function to create navigation items
function createNavItems(container, items, isCenter = false) {
    container.innerHTML = '';
    items.forEach(item => {
        if (isCenter) {
            const link = document.createElement('a');
            link.href = item.href;
            link.textContent = item.text;
            container.appendChild(link);
        } else {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = item.href;
            link.textContent = item.text;
            li.appendChild(link);
            container.appendChild(li);
        }
    });
}

// Function to initialize submenu animation
function initializeSubmenu() {
    const submenuContainer = document.querySelector('.submenu-container');
    if (submenuContainer) {
        // Slide in the submenu after a brief delay
        setTimeout(() => {
            submenuContainer.classList.add('active');
        }, 300);
        
        // Optional: Add subtle fade-in for main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            setTimeout(() => {
                mainContent.style.opacity = '0';
                mainContent.style.transform = 'translateY(20px)';
                mainContent.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                setTimeout(() => {
                    mainContent.style.opacity = '1';
                    mainContent.style.transform = 'translateY(0)';
                }, 100);
            }, 500);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the landing page
    const centerNav = document.getElementById('centerNav');
    const topNav = document.getElementById('topNav');
    
    if (centerNav && topNav) {
        // Landing page - randomize navigation
        const shuffledItems = shuffleArray(navItems);
        createNavItems(topNav, shuffledItems, false);
        createNavItems(centerNav, shuffledItems, true);
    } else {
        // Section page - initialize submenu animation
        initializeSubmenu();
    }
});