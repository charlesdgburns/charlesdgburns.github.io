// mosaic.js
// Reads ALL_PAGES, PAGE_PATH, PAGE_SECTION injected inline by mosaic.liquid.
// GSAP must be loaded before this script.

(function () {

    // ── Helpers ───────────────────────────────────────────────────────────────

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Directory-based card filtering ────────────────────────────────────────

    function getDepth(path) {
        return path.split('/').filter(Boolean).length;
    }

    function filterPages(pages, pagePath) {
        const currentDepth = getDepth(pagePath);

        return pages.filter(p => {
            const pDepth = getDepth(p.path);
            if (pagePath === '/') {
                return pDepth > 1;
            }
            return p.path.startsWith(pagePath) && pDepth >= currentDepth + 1;
        });
    }

    function getSection(path) {
        if (path.includes('learning')) {
            return 'learning';
        } else if (path.includes('creating')) {
            return 'creating';
        } else if (path.includes('about')) {
            return 'about';
        } else if (path.includes('life')) {
            return 'life';
        }
        return null;
    }

    // ── Build card DOM ────────────────────────────────────────────────────────

    const mosaic    = document.getElementById('mosaic');
    let   animating = false;

    function buildCard(page) {
        const card = document.createElement('div');
        card.className = `card ${page.mosaic_size || 'medium'}`;
        card.dataset.section = getSection(page.path);
        card.dataset.path    = page.path;
        card.dataset.href    = page.href;

        const showTag = PAGE_PATH === '/';

        if (page.image) {
            card.innerHTML = `
                <div class="card-img-wrap">
                    <img class="card-img" src="${page.image}" alt="${page.title}" loading="lazy">
                    <div class="card-img-overlay">
                        ${showTag ? `<div class="card-section-tag">${page.section}</div>` : ''}
                        <div class="card-title">${page.title}</div>
                        ${page.desc ? `<div class="card-desc">${page.desc}</div>` : ''}
                    </div>
                </div>`;
        } else {
            card.innerHTML = `
                <div class="card-text-body">
                    ${showTag ? `<div class="card-section-tag">${page.section}</div>` : ''}
                    <div class="card-title">${page.title}</div>
                    ${page.desc ? `<div class="card-desc">${page.desc}</div>` : ''}
                </div>`;
        }

        gsap.set(card, { position: 'fixed', left: 0, top: -40, width: 180, scale: 0.08, opacity: 0 });
        card.addEventListener('click', () => { if (!animating) triggerCardExit(card); });
        return card;
    }

    // Populate mosaic with the filtered set of pages
    const visiblePages = filterPages(ALL_PAGES, PAGE_PATH);
    shuffle(visiblePages).forEach(page => mosaic.appendChild(buildCard(page)));

    // ── Ghost layout: compute target positions for the mosaic columns ─────────

    function computeTargets(cards) {
        const headerH = document.querySelector('header').offsetHeight;
        const pad      = window.innerWidth <= 768 ? 16 : 40;

        const ghost = document.createElement('div');
        ghost.style.cssText = `
            position: fixed;
            top: ${headerH + 20}px;
            left: ${pad}px; right: ${pad}px;
            visibility: hidden; pointer-events: none;
            columns: 5 180px; column-gap: 14px;
            z-index: -1;
        `;

        const pairs = shuffle(cards.map(card => {
            const clone = document.createElement('div');
            clone.className = card.className;
            clone.innerHTML = card.innerHTML;
            clone.style.cssText = 'break-inside:avoid; margin-bottom:14px; position:relative;';
            return { clone, card };
        }));

        pairs.forEach(({ clone }) => ghost.appendChild(clone));
        document.body.appendChild(ghost);
        void ghost.getBoundingClientRect(); // force layout

        const targets = pairs.map(({ clone, card }) => {
            const r = clone.getBoundingClientRect();
            return { card, x: r.left, y: r.top, w: r.width, h: r.height };
        });

        document.body.removeChild(ghost);
        return targets;
    }

    // ── Resize: reposition visible cards ─────────────────────────────────────

    let currentVisibleCards = [];
    let resizeTimer = null;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (animating || !currentVisibleCards.length) return;
            const targets = computeTargets(currentVisibleCards);
            targets.forEach(({ card, x, y, w }) => {
                gsap.to(card, { left: x, top: y, width: w, duration: 0.3, ease: 'power2.out' });
            });
        }, 120);
    });

    // ── Enter animation ───────────────────────────────────────────────────────

    function enterAnimation(cards) {
        if (!cards.length) return;
        animating = true;
        cards.forEach(c => c.style.pointerEvents = 'none');

        const targets = computeTargets(cards);
        targets.forEach(({ card, x, y, w }) => {
            gsap.set(card, { left: x, top: y, width: w, scale: 0.08, opacity: 0 });
        });

        gsap.to(cards, {
            scale: 1, opacity: 1,
            duration: 0.1,
            stagger: { amount: 0.2, from: 'random' },
            ease: 'back.out(1.4)',
            onComplete: () => {
                cards.forEach(c => c.style.pointerEvents = '');
                currentVisibleCards = cards;
                animating = false;
            }
        });
    }

    // ── Exit animation ────────────────────────────────────────────────────────

    function exitAnimation(cards, onComplete) {
        if (!cards.length) { onComplete && onComplete(); return; }
        animating = true;
        currentVisibleCards = [];
        cards.forEach(c => c.style.pointerEvents = 'none');

        gsap.to(cards, {
            scale: 0.08, opacity: 0,
            duration: 0.2,
            stagger: { amount: 0.1, from: 'random' },
            ease: 'power2.in',
            onComplete: () => {
                animating = false;
                onComplete && onComplete();
            }
        });
    }

    // ── Page load & Active State Logic ────────────────────────────────────────

    window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('ready');

        // Dynamically get the current section from the URL path
        // e.g., "/learning/" -> "learning"
        const currentSection = PAGE_PATH.split('/').filter(Boolean)[0];

        if (currentSection) {
            const link = document.querySelector(`.section-nav a[data-section="${currentSection}"]`);
            if (link) link.classList.add('active');
        } else if (typeof PAGE_SECTION !== 'undefined' && PAGE_SECTION) {
            // Fallback just in case your Liquid is injecting it directly
            const link = document.querySelector(`.section-nav a[data-section="${PAGE_SECTION}"]`);
            if (link) link.classList.add('active');
        }

        const allCards = [...document.querySelectorAll('.card')];
        enterAnimation(allCards);
    });

    // ── Nav hover & Click (Toggle functionality) ──────────────────────────────

    let activeSection = null;

    function highlightSection(section) {
        document.querySelectorAll('.card').forEach(c => {
            c.classList.toggle('highlighted', c.dataset.section === section);
            c.classList.toggle('dimmed',      c.dataset.section !== section);
        });
    }

    function clearHighlight() {
        document.querySelectorAll('.card').forEach(c =>
            c.classList.remove('highlighted', 'dimmed'));
    }

    document.querySelectorAll('.section-nav a').forEach(link => {
        // Create a fresh clone to ensure we aren't doubling up event listeners
        const fresh = link.cloneNode(true);
        link.parentNode.replaceChild(fresh, link);

        fresh.addEventListener('mouseenter', () => {
            if (!activeSection && !animating) highlightSection(fresh.dataset.section);
        });
        
        fresh.addEventListener('mouseleave', () => {
            if (!activeSection) clearHighlight();
        });

        fresh.addEventListener('click', e => {
            e.preventDefault(); 
            if (animating) return;

            const targetUrl = fresh.href;
            const isAlreadyActive = fresh.classList.contains('active');
            
            // Toggle Logic: If we click the link that is already active, return home
            const finalDestination = isAlreadyActive ? '/' : targetUrl;

            const allCards = [...document.querySelectorAll('.card')];
            const visible = allCards.filter(c => parseFloat(gsap.getProperty(c, 'opacity')) > 0.2);

            // Play exit animation, then go to the final URL
            exitAnimation(visible, () => {
                window.location.href = finalDestination;
            });
        });
    }); 

    // ── Card click: border expansion → navigate ───────────────────────────────

    function triggerCardExit(card) {
        if (animating) return;
        animating = true;

        const allCards = [...document.querySelectorAll('.card')];
        const visible  = allCards.filter(c => c !== card && parseFloat(gsap.getProperty(c, 'opacity')) > 0.2);
        const href     = card.dataset.href;
        const expander = document.getElementById('border-expander');

        allCards.forEach(c => c.style.pointerEvents = 'none');

        // Shrink all other cards
        gsap.to(visible, {
            scale: 0.08, opacity: 0,
            duration: 0.18,
            stagger: { amount: 0.08, from: 'random' },
            ease: 'power2.in',
        });

        const cx = parseFloat(gsap.getProperty(card, 'left'));
        const cy = parseFloat(gsap.getProperty(card, 'top'));
        const cw = parseFloat(gsap.getProperty(card, 'width'));
        const ch = card.offsetHeight;

        gsap.set(expander, {
            left: cx, top: cy, width: cw, height: ch || 180,
            borderRadius: 16, opacity: 1, background: 'transparent',
        });

        gsap.to(card, { background: '#dddad4', opacity:0,  scale:1, duration: 0.1, delay: 0.01, });
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;

        gsap.to(expander, {
            left: 0, 
            top: headerHeight-1,
            width:  window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
            duration: 0.2,
            delay: 0.2,
            ease: 'power3.inOut',
            onComplete: () => {
                if (href && href !== '#') window.location.href = href;
            }
        });
    }

})();