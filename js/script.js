// Navigation items for randomization
const navItems = [
    { text: 'About', href: './about/' },
    { text: 'Learning', href: './learning/' },
    { text: 'Creating', href: './creating/' },
    { text: 'Life', href: './life/' }
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

// WORDCLOUD JAVASCRIPT //
// Add bounce effect on click
document.querySelectorAll('.word').forEach(word => {
    word.addEventListener('click', function(e) {
        this.style.animation = 'none';
        setTimeout(() => {
            this.style.animation = '';
            this.classList.add('clicked');
        }, 10);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const wordcloud = document.querySelector('.wordcloud');
    if (!wordcloud) return;

    const words = wordcloud.querySelectorAll('.word');
    
    words.forEach((word, index) => {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Spring effect variables
        let velocityX = 0;
        let velocityY = 0;
        const springStrength = 0.02;
        const damping = 0.85;

        // Get initial position from CSS
        const computedStyle = window.getComputedStyle(word);
        const matrix = computedStyle.transform;
        
        word.addEventListener('mousedown', dragStart);
        word.addEventListener('touchstart', dragStart);
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        // Idle spring animation
        let animationFrame;
        function idleSpring() {
            const rect = word.getBoundingClientRect();
            const wordcloudRect = wordcloud.getBoundingClientRect();
            
            // Random target within bounds
            const targetX = Math.sin(Date.now() * 0.001 + index) * 15;
            const targetY = Math.cos(Date.now() * 0.0008 + index) * 15;
            
            velocityX += (targetX - xOffset) * springStrength;
            velocityY += (targetY - yOffset) * springStrength;
            
            velocityX *= damping;
            velocityY *= damping;
            
            xOffset += velocityX;
            yOffset += velocityY;
            
            if (!isDragging) {
                setTranslate(xOffset, yOffset, word);
            }
            
            animationFrame = requestAnimationFrame(idleSpring);
        }
        
        // Start idle animation
        idleSpring();

        function dragStart(e) {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === word) {
                isDragging = true;
                word.style.cursor = 'grabbing';
                word.style.zIndex = '1000';
                cancelAnimationFrame(animationFrame);
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, word);
            }
        }

        function dragEnd(e) {
            if (isDragging) {
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                word.style.cursor = 'grab';
                word.style.zIndex = '1';
                
                // Resume spring animation
                idleSpring();
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }

        // Initial cursor
        word.style.cursor = 'grab';
    });
});