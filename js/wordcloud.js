// Springy draggable wordcloud
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

        word.addEventListener('mousedown', dragStart);
        word.addEventListener('touchstart', dragStart);
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);

        // Idle spring animation
        let animationFrame;
        function idleSpring() {
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
                
                idleSpring();
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate(${xPos}px, ${yPos}px)`;
        }

        word.style.cursor = 'grab';
    });
});