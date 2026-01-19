document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch Content from CMS
    fetch('/api/content')
        .then(res => res.json())
        .then(data => {
            if (!data) return;

            // Hero
            setText('hero-badge', data.hero.badge);
            setHTML('hero-title', data.hero.title);
            setHTML('hero-subtitle', data.hero.subtitle);

            // Hero Highlights
            const heroHighlights = document.getElementById('hero-highlights');
            if (heroHighlights && data.hero.highlights) {
                heroHighlights.innerHTML = data.hero.highlights.map(h =>
                    `<span><i class="${h.icon}"></i> ${h.text}</span>`
                ).join('');
            }

            // About
            setText('about-title', data.about.title);
            setHTML('about-p1', data.about.p1);
            setHTML('about-p2', data.about.p2);

            const aboutStats = document.getElementById('about-stats');
            if (aboutStats && data.about.stats) {
                aboutStats.innerHTML = data.about.stats.map(s =>
                    `<div>
                        <h3 style="color: var(--accent-color); font-size: 2rem; margin-bottom: 5px;">${s.value}</h3>
                        <p>${s.label}</p>
                    </div>`
                ).join('');
            }

            // Services
            const servicesGrid = document.getElementById('services-grid');
            if (servicesGrid && data.services.items) {
                servicesGrid.innerHTML = data.services.items.map(service =>
                    `<div class="service-card fade-in-scroll visible">
                        <div class="service-img">
                            <img src="${service.image}" alt="${service.title}">
                        </div>
                        <div class="service-info">
                            <h3><i class="${service.icon}"></i> ${service.title}</h3>
                            <ul class="service-list">
                                ${service.list.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    </div>`
                ).join('');
                ).join('');
}

            // Special Prints
            const specialGrid = document.getElementById('special-grid');
if (specialGrid && data.specialPrints) {
    setText('special-title', data.specialPrints.title);
    setText('special-subtitle', data.specialPrints.subtitle);

    specialGrid.innerHTML = data.specialPrints.items.map(item =>
        `<div class="special-card fade-in-scroll visible">
                        <div class="special-img">
                            <img src="${item.image}" alt="${item.title}">
                        </div>
                        <div class="special-info">
                            <h3>${item.title}</h3>
                            <p>${item.desc}</p>
                            <a href="https://wa.me/91737402948?text=Hi, I want to inquire about ${item.title}" target="_blank" class="btn-sm">Inquire Now</a>
                        </div>
                    </div>`
    ).join('');
}

// Gallery
const galleryGrid = document.querySelector('.gallery-grid');
if (galleryGrid && data.gallery) {
    galleryGrid.innerHTML = data.gallery.map(item =>
        `<div class="gallery-item fade-in-scroll visible">
                        <img src="${item.image}" alt="${item.caption}">
                        <div class="gallery-overlay">${item.caption}</div>
                    </div>`
    ).join('');
}

// Contact
setText('contact-desc', data.contact.desc);
setHTML('contact-address', data.contact.address);
setText('contact-email', data.contact.email);
setText('contact-phone', data.contact.phone);
setText('contact-timings', data.contact.timings);



// Apply theme settings
applyTheme(data.theme);

// Dynamic SEO Update
updateSEO(data);

// Re-trigger animations for new elements
setupObserver();
        })
        .catch (err => console.log('Running in static mode or server error:', err));

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        navLinks.classList.remove('active');
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

setupObserver();
});

function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
}

function setupObserver() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-scroll').forEach(el => observer.observe(el));
}

function applyTheme(theme) {
    if (!theme) return;

    // Set CSS variables for theme
    const root = document.documentElement;

    if (theme.primaryColor) root.style.setProperty('--secondary-dark', theme.primaryColor);
    if (theme.accentColor) root.style.setProperty('--accent-color', theme.accentColor);
    if (theme.backgroundColor) root.style.setProperty('--primary-white', theme.backgroundColor);
    if (theme.textColor) root.style.setProperty('--text-dark', theme.textColor);
    if (theme.secondaryColor) root.style.setProperty('--text-light', theme.secondaryColor);
    if (theme.borderColor) root.style.setProperty('--border-color', theme.borderColor);

    // Update accent hover if accent color is changed
    if (theme.accentColor) {
        // Calculate a darker shade for hover effect
        const darkerAccent = shadeColor(theme.accentColor, -20);
        root.style.setProperty('--accent-hover', darkerAccent);
    }
}

// Helper function to calculate a darker/lighter shade of a hex color
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = Math.max(0, R);
    G = Math.max(0, G);
    B = Math.max(0, B);

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

function updateSEO(data) {
    if (data.hero && data.hero.title) {
        // Strip HTML for title tag
        const cleanTitle = data.hero.title.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        document.title = `${cleanTitle} | Kalamboli`;

        // Update Meta Description dynamically if hero subtitle exists
        if (data.hero.subtitle) {
            const cleanDesc = data.hero.subtitle.replace(/<[^>]*>?/gm, '').trim();
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.setAttribute('content', `${cleanDesc} - Available at Metro Stationery Kalamboli.`);
        }
    }
}
