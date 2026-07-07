const navToggle = document.querySelector('.nav-toggle');
const header = document.querySelector('.header');
const navLinks = document.querySelectorAll('.header-nav .nav-item');
const yearEl = document.getElementById('year');
const revealEls = document.querySelectorAll('.reveal');
const customScrollbar = document.getElementById('custom-scrollbar');
const customScrollbarTrack = document.getElementById('custom-scrollbar-track');
const customScrollbarThumb = document.getElementById('custom-scrollbar-thumb');
const scrollPercentEl = document.getElementById('scroll-percent');
const scrollMarkersEl = document.getElementById('scroll-markers');
const heroTypewriter = document.getElementById('hero-typewriter');
const heroTypewriterText = document.getElementById('hero-typewriter-text');
const heroTypewriterCursor = document.getElementById('hero-typewriter-cursor');
const heroGlows = document.querySelectorAll('.hero-glow');
const scrollSections = document.querySelectorAll('.scroll-section');
const sections = document.querySelectorAll('main section[id]');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const HERO_PHRASES = [
    'software that works under pressure',
    'software that enhances experience',
    'Roblox scripts that run smoothly',
    'platforms built for scale',
    'products users actually love',
    'solutions that ship with confidence',
].map((phrase) => phrase.charAt(0).toUpperCase() + phrase.slice(1));

const TYPE_SPEED_MS = 105;
const DELETE_SPEED_MS = 72;
const PAUSE_TYPED_MS = 4800;
const PAUSE_DELETED_MS = 1000;

let isDraggingScrollbar = false;
let scrollActivityTimeout;
let scrollMarkers = [];

if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
}

function setNavOpen(isOpen) {
    document.body.classList.toggle('nav-open', isOpen);
    navToggle?.setAttribute('aria-expanded', String(isOpen));
    navToggle?.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
}

navToggle?.addEventListener('click', () => {
    const isOpen = !document.body.classList.contains('nav-open');
    setNavOpen(isOpen);
});

function getScrollOffset() {
    return header?.offsetHeight ?? 80;
}

function scrollToSection(targetId, instant = false) {
    const behavior = instant || prefersReducedMotion ? 'auto' : 'smooth';

    if (!targetId || targetId === 'top') {
        window.scrollTo({ top: 0, behavior });
        return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior });
}

function cleanUrl() {
    const url = `${window.location.pathname}${window.location.search}`;
    history.replaceState(null, '', url);
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    event.preventDefault();
    scrollToSection(hash.slice(1));
    cleanUrl();
    setNavOpen(false);
});

if (window.location.hash) {
    const targetId = window.location.hash.slice(1);
    requestAnimationFrame(() => {
        scrollToSection(targetId, true);
        cleanUrl();
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        setNavOpen(false);
    }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 720) {
        setNavOpen(false);
    }

    updateCustomScrollbar();
});

function initScrollMarkers() {
    if (!scrollMarkersEl) return;

    scrollMarkersEl.innerHTML = '';
    scrollMarkers = Array.from(sections).map((section) => {
        const marker = document.createElement('span');
        marker.className = 'custom-scrollbar-marker';
        marker.dataset.section = section.id;
        scrollMarkersEl.appendChild(marker);
        return marker;
    });
}

function updateScrollMarkers(scrollable, scrollTop) {
    if (!customScrollbarTrack || scrollMarkers.length === 0) return;

    const trackInset = 10;
    const trackHeight = customScrollbarTrack.clientHeight - trackInset * 2;

    scrollMarkers.forEach((marker) => {
        const section = document.getElementById(marker.dataset.section);
        if (!section) return;

        const sectionTop = section.offsetTop;
        const markerTop = scrollable > 0
            ? trackInset + (sectionTop / scrollable) * trackHeight
            : trackInset;

        marker.style.top = `${markerTop}px`;

        const sectionBottom = sectionTop + section.offsetHeight;
        const isActive = scrollTop + window.innerHeight * 0.35 >= sectionTop
            && scrollTop + window.innerHeight * 0.35 < sectionBottom;

        marker.classList.toggle('is-active', isActive);
    });
}

function updateCustomScrollbar() {
    if (!customScrollbar || !customScrollbarTrack || !customScrollbarThumb) return;

    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollable = scrollHeight - viewportHeight;
    const canScroll = scrollable > 8;

    customScrollbar.classList.toggle('is-visible', canScroll);

    if (!canScroll) return;

    const progress = scrollable > 0 ? scrollTop / scrollable : 0;
    const trackHeight = customScrollbarTrack.clientHeight;
    const thumbHeight = Math.max((viewportHeight / scrollHeight) * trackHeight, 56);
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = progress * maxThumbTop;

    customScrollbarThumb.style.height = `${thumbHeight}px`;
    customScrollbarThumb.style.transform = `translateY(${thumbTop}px)`;

    if (scrollPercentEl) {
        scrollPercentEl.textContent = `${Math.round(progress * 100)}%`;
    }

    updateScrollMarkers(scrollable, scrollTop);
}

function scrollToThumbPosition(clientY, instant = false) {
    if (!customScrollbarTrack || !customScrollbarThumb) return;

    const trackRect = customScrollbarTrack.getBoundingClientRect();
    const thumbHeight = customScrollbarThumb.offsetHeight;
    const maxThumbTop = trackRect.height - thumbHeight;
    const relativeY = Math.min(Math.max(clientY - trackRect.top - thumbHeight / 2, 0), maxThumbTop);
    const ratio = maxThumbTop > 0 ? relativeY / maxThumbTop : 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const behavior = instant || prefersReducedMotion || isDraggingScrollbar ? 'auto' : 'smooth';

    window.scrollTo({ top: ratio * scrollable, behavior });
}

function updateScrollEffects() {
    const scrollTop = window.scrollY;

    header?.classList.toggle('is-scrolled', scrollTop > 24);
    updateCustomScrollbar();

    customScrollbar?.classList.add('is-scrolling');
    window.clearTimeout(scrollActivityTimeout);
    scrollActivityTimeout = window.setTimeout(() => {
        if (!isDraggingScrollbar) {
            customScrollbar?.classList.remove('is-scrolling');
        }
    }, 900);

    if (!prefersReducedMotion) {
        heroGlows.forEach((glow, index) => {
            const speed = index === 0 ? 0.18 : 0.12;
            glow.style.transform = `translateY(${scrollTop * speed}px)`;
        });
    }
}

updateScrollEffects();
initScrollMarkers();
window.addEventListener('scroll', updateScrollEffects, { passive: true });

customScrollbarTrack?.addEventListener('click', (event) => {
    if (event.target === customScrollbarThumb) return;
    scrollToThumbPosition(event.clientY);
});

customScrollbarThumb?.addEventListener('pointerdown', (event) => {
    isDraggingScrollbar = true;
    customScrollbar?.classList.add('is-dragging');
    customScrollbarThumb.classList.add('is-dragging');
    customScrollbarThumb.setPointerCapture(event.pointerId);
    event.preventDefault();
});

customScrollbarThumb?.addEventListener('pointermove', (event) => {
    if (!isDraggingScrollbar) return;
    scrollToThumbPosition(event.clientY, true);
});

function endScrollbarDrag(event) {
    if (!isDraggingScrollbar) return;
    isDraggingScrollbar = false;
    customScrollbar?.classList.remove('is-dragging');
    customScrollbarThumb?.classList.remove('is-dragging');
    if (event.pointerId !== undefined) {
        customScrollbarThumb?.releasePointerCapture(event.pointerId);
    }
}

customScrollbarThumb?.addEventListener('pointerup', endScrollbarDrag);
customScrollbarThumb?.addEventListener('pointercancel', endScrollbarDrag);

function revealElement(el) {
    el.classList.add('is-visible');
}

if (prefersReducedMotion) {
    revealEls.forEach(revealElement);
    scrollSections.forEach((section) => section.classList.add('is-in-view'));
} else {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                revealElement(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealEls.forEach((el) => revealObserver.observe(el));

    const heroReveals = document.querySelectorAll('.hero .reveal');
    requestAnimationFrame(() => {
        heroReveals.forEach((el, index) => {
            window.setTimeout(() => revealElement(el), 120 + index * 90);
        });
    });

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-in-view', entry.isIntersecting);
            });
        },
        { threshold: 0.15, rootMargin: '-10% 0px -10% 0px' }
    );

    scrollSections.forEach((section) => sectionObserver.observe(section));
}

const navObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('id');
            if (!id) return;

            navLinks.forEach((link) => {
                const href = link.getAttribute('href');
                link.classList.toggle('nav-item-active', href === `#${id}`);
            });
        });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
);

sections.forEach((section) => navObserver.observe(section));

function sleep(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

function setTypewriterState(state) {
    if (!heroTypewriter) return;
    heroTypewriter.classList.toggle('is-typing', state === 'typing');
    heroTypewriter.classList.toggle('is-deleting', state === 'deleting');
    heroTypewriter.classList.toggle('is-paused', state === 'paused');
}

function pulseKeystroke() {
    if (!heroTypewriter) return;
    heroTypewriter.classList.add('is-keystroke');
    window.setTimeout(() => heroTypewriter.classList.remove('is-keystroke'), 160);
}

function getCharDelay(char, baseDelay, isDeleting) {
    if (prefersReducedMotion) return 0;

    let delay = baseDelay + Math.random() * 55;

    if (char === ' ') {
        delay += 55;
    } else if ('.,;!?'.includes(char)) {
        delay += isDeleting ? 90 : 180;
    }

    return delay;
}

function renderPhrase(text, effect = null) {
    if (!heroTypewriterText) return;

    if (!text) {
        heroTypewriterText.innerHTML = '';
        return;
    }

    const chars = text.split('');
    heroTypewriterText.innerHTML = chars.map((char, index) => {
        const classes = ['type-char'];
        if (effect === 'type' && index === chars.length - 1) {
            classes.push('type-char--enter');
        }
        if (effect === 'delete' && index === chars.length - 1) {
            classes.push('type-char--exit');
        }

        const safeChar = char === ' ' ? '\u00A0' : char;
        return `<span class="${classes.join(' ')}">${safeChar}</span>`;
    }).join('');
}

async function initHeroTypewriter() {
    if (!heroTypewriterText || HERO_PHRASES.length === 0) return;

    let phraseIndex = 0;

    while (true) {
        const phrase = HERO_PHRASES[phraseIndex];

        setTypewriterState('typing');

        for (let i = 1; i <= phrase.length; i += 1) {
            const slice = phrase.slice(0, i);
            renderPhrase(slice, 'type');
            pulseKeystroke();
            await sleep(getCharDelay(slice.slice(-1), TYPE_SPEED_MS, false));
        }

        setTypewriterState('paused');
        await sleep(PAUSE_TYPED_MS);

        setTypewriterState('deleting');

        for (let i = phrase.length - 1; i >= 0; i -= 1) {
            const slice = phrase.slice(0, i);
            renderPhrase(slice, 'delete');
            pulseKeystroke();
            await sleep(getCharDelay(phrase[i], DELETE_SPEED_MS, true));
        }

        setTypewriterState('paused');
        await sleep(PAUSE_DELETED_MS);

        phraseIndex = (phraseIndex + 1) % HERO_PHRASES.length;
    }
}

document.addEventListener('DOMContentLoaded', initHeroTypewriter);

const contactForm = document.getElementById('contact-form');
const contactSubmit = document.getElementById('contact-submit');
const formStatus = document.getElementById('form-status');

function setFormStatus(message, type = '') {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.remove('is-success', 'is-error');
    if (type) {
        formStatus.classList.add(type);
    }
}

contactForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        website: formData.get('website'),
    };

    contactSubmit.disabled = true;
    contactSubmit.textContent = 'Sending...';
    setFormStatus('');

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
            setFormStatus(data.message || 'Something went wrong. Please try again.', 'is-error');
            return;
        }

        contactForm.reset();
        setFormStatus(data.message || 'Message sent successfully.', 'is-success');
    } catch {
        setFormStatus('Unable to reach the server. Please try again later.', 'is-error');
    } finally {
        contactSubmit.disabled = false;
        contactSubmit.textContent = 'Message us';
    }
});
