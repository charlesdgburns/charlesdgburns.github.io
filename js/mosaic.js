// mosaic.js
// Reads `pages` array injected inline by home.liquid (Jekyll build).
// GSAP must be loaded before this script.

(function () {

    // ── Helpers ──────────────────────────────────────────────────────────────

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Build card DOM from page data ─────────────────────────────────────────

    const mosaic = document.getElementById('mosaic');
    let animating = false;

    shuffle(pages).forEach(page => {
        const card = document.createElement('div');
        card.className = `card ${page.size || 'medium'}`;
        card.dataset.section = page.section;
        card.dataset.href = page.href;

        if (page.image) {
            card.innerHTML = `
                <div class="card-img-wrap">
                    <img class="card-img" src="${page.image}" alt="${page.title}" loading="lazy">
                    <div class="card-img-overlay">
                        <div class="card-section-tag">${page.section}</div>
                        <div class="card-title">${page.title}</div>
                        ${page.desc ? `<div class="card-desc">${page.desc}</div>` : ''}
                    </div>
                </div>`;
        } else {
            card.innerHTML = `
                <div class="card-text-body">
                    <div class="card-section-tag">${page.section}</div>
                    <div class="card-title">${page.title}</div>
                    ${page.desc ? `<div class="card-desc">${page.desc}</div>` : ''}
                </div>`;
        }

        // Start as an invisible dot — enterAnimation will place and expand it
        gsap.set(card, { position: 'fixed', left: 0, top: -40, width: 180, scale: 0.08, opacity: 0 });
        mosaic.appendChild(card);
        card.addEventListener('click', () => { if (!animating) triggerCardExit(card); });
    });

    // ── Ghost layout — computes where each card should sit in the mosaic ──────
    //
    // We clone cards into a hidden off-screen mosaic so the browser does the
    // column layout for us, then read those positions as targets for GSAP.

    function computeTargets(cards) {
        const headerH = document.querySelector('header').offsetHeight;
        const pad = 40;

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

    // ── Resize: reposition visible cards when window size changes ─────────────

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

    // ── Enter: cards appear as dots at mosaic positions, then expand ──────────

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
            duration: 0.3,
            stagger: { amount: 0.2, from: 'random' },
            ease: 'back.out(1.4)',
            onComplete: () => {
                cards.forEach(c => c.style.pointerEvents = '');
                currentVisibleCards = cards;
                animating = false;
            }
        });
    }

    // ── Exit: cards shrink to dots in place, then callback ───────────────────

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

    // ── Page load ─────────────────────────────────────────────────────────────

    window.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('ready');
        const allCards = [...document.querySelectorAll('.card')];

        // On subpages, PAGE_SECTION is set — show only that section's cards.
        // On the landing page it's empty — show all.
        const PAGE_SECTION = document.body.dataset.section || null;
        const toShow = PAGE_SECTION
            ? allCards.filter(c => c.dataset.section === PAGE_SECTION)
            : allCards;

        enterAnimation(toShow);
    });

    // ── Nav hover: highlight matching cards (landing page only) ───────────────

    let activeSection = null;

    function highlightSection(section) {
        document.querySelectorAll('.card').forEach(c => {
            c.classList.toggle('highlighted', c.dataset.section === section);
            c.classList.toggle('dimmed',      c.dataset.section !== section);
        });
    }

    function clearHighlight() {
        document.querySelectorAll('.card').forEach(c => c.classList.remove('highlighted', 'dimmed'));
    }

    // ── Nav click: filter cards by section (toggle behaviour) ────────────────

    document.querySelectorAll('.section-nav a').forEach(link => {
        // Clone to remove any stale listeners added by script.js
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

            const section = fresh.dataset.section;
            document.querySelectorAll('.section-nav a').forEach(a => {
                a.classList.toggle('active', a.dataset.section === section);
            });
            clearHighlight();

            const allCards  = [...document.querySelectorAll('.card')];
            const visible   = allCards.filter(c => parseFloat(gsap.getProperty(c, 'opacity')) > 0.2);
            const nextCards = section === activeSection
                ? allCards   // toggle off → show everything
                : allCards.filter(c => c.dataset.section === section);

            activeSection = section === activeSection ? null : section;
            if (!activeSection) {
                document.querySelectorAll('.section-nav a').forEach(a => a.classList.remove('active'));
            }

            exitAnimation(visible, () => enterAnimation(nextCards));
        });
    });

    // ── Card click: shrink others, expand clicked card border → navigate ──────

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

        // Read clicked card position
        const cx = parseFloat(gsap.getProperty(card, 'left'));
        const cy = parseFloat(gsap.getProperty(card, 'top'));
        const cw = parseFloat(gsap.getProperty(card, 'width'));
        const ch = card.offsetHeight;

        // Place expander over the card
        gsap.set(expander, {
            left: cx, top: cy, width: cw, height: ch || 180,
            borderRadius: 16, opacity: 1, background: 'transparent',
        });

        // Wash card interior grey
        gsap.to(card, { background: '#dddad4', scale: 1, duration: 0.2, delay: 0.1 });

        // Expand border to fill viewport, then navigate
        gsap.to(expander, {
            left: 0, top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            borderRadius: 0,
            duration: 0.45,
            delay: 0.2,
            ease: 'power3.inOut',
            onComplete: () => {
                if (href && href !== '#') window.location.href = href;
            }
        });
    }

})();
