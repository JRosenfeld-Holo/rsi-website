/* ============================================
   RSI — Retail Sites International, Inc.
   Main JavaScript
   ============================================ */

import './style.css';
import rsiContent from './src/data/rsi-content.json';
import logos from './src/data/logos.json';

// ---------- Navbar Scroll Effect ----------
const navbar = document.getElementById('navbar');
const handleScroll = () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
};
window.addEventListener('scroll', handleScroll, { passive: true });

// ---------- Mobile Navigation Toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('open');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
});

// Close mobile nav when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ---------- Smooth Scroll for Anchor Links ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ---------- Scroll-Triggered Reveal Animations ----------
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Stagger animation for elements that appear together, but disable on mobile to prevent staggering glitches
      const delay = window.innerWidth > 768 ? index * 100 : 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ---------- Team Bio Expand/Collapse ----------
document.addEventListener('click', (e) => {
  const toggle = e.target.closest('.team-bio-toggle');
  if (!toggle) return;

  const targetId = toggle.getAttribute('data-target');
  const bioFull = document.getElementById(targetId);
  if (!bioFull) return;

  const isExpanded = bioFull.classList.contains('expanded');

  // Collapse all other bios
  document.querySelectorAll('.team-bio-full.expanded').forEach(bio => {
    bio.classList.remove('expanded');
  });
  document.querySelectorAll('.team-bio-toggle.expanded').forEach(btn => {
    btn.classList.remove('expanded');
    if (btn.childNodes[0] && btn.childNodes[0].nodeType === Node.TEXT_NODE) {
      btn.childNodes[0].textContent = 'Read Full Bio ';
    }
  });

  // Toggle current bio
  if (!isExpanded) {
    bioFull.classList.add('expanded');
    toggle.classList.add('expanded');
    if (toggle.childNodes[0] && toggle.childNodes[0].nodeType === Node.TEXT_NODE) {
      toggle.childNodes[0].textContent = 'Close Bio ';
    }
  }
});

// ---------- Populate Content ----------
const populateContent = () => {
  // Hero
  if (rsiContent.hero) {
    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroTitle) heroTitle.innerHTML = rsiContent.hero.title;
    if (heroSubtitle) heroSubtitle.textContent = rsiContent.hero.subtitle;
  }

  // About
  if (rsiContent.about) {
    const aboutTitle = document.getElementById('about-title');
    const aboutParagraphs = document.getElementById('about-paragraphs');
    if (aboutTitle) aboutTitle.textContent = rsiContent.about.title;
    if (aboutParagraphs) {
      aboutParagraphs.innerHTML = rsiContent.about.paragraphs.map(p => `<p class="about-text">${p}</p>`).join('');
    }
  }

  // Services
  if (rsiContent.services) {
    const servicesGrid = document.getElementById('services');
    if (servicesGrid) {
      servicesGrid.innerHTML = rsiContent.services.map(service => `
        <div class="service-card">
          <div class="service-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h3>${service.title}</h3>
          <p>${service.description}</p>
        </div>
      `).join('');
    }
  }

  // Team
  if (rsiContent.team) {
    const teamGrid = document.getElementById('teamGrid');
    if (teamGrid) {
      teamGrid.innerHTML = rsiContent.team.map(member => {
        // Find the first sentence boundary (. ) after 80 characters to avoid splitting titles like Mr. or initials
        let splitIdx = member.bio.indexOf('. ', 80);
        let previewText = member.bio;
        let fullText = '';

        if (splitIdx !== -1) {
          previewText = member.bio.substring(0, splitIdx + 1);
          fullText = member.bio.substring(splitIdx + 2);
        } else if (member.bio.length > 120) {
          // Fallback if no period found
          const spaceIdx = member.bio.indexOf(' ', 100);
          if (spaceIdx !== -1) {
            previewText = member.bio.substring(0, spaceIdx) + '...';
            fullText = member.bio.substring(spaceIdx + 1);
          }
        }

        return `
        <div class="team-card reveal">
          <div class="team-photo">
            ${member.image ? `<img src="${member.image}" alt="${member.name}" style="width:100%; height:100%; object-fit:cover; border-radius: 8px;" />` : `<span class="team-photo-initials">${member.name.split(' ').map(n => n[0]).join('')}</span>`}
          </div>
          <div class="team-info">
            <h3 class="team-name">${member.name}</h3>
            <div class="team-title">${member.role}</div>
            <p class="team-bio-preview">${previewText}</p>
            <div class="team-bio-full" id="bio-${member.id}">
              <p>${fullText}</p>
            </div>
            <button class="team-bio-toggle" data-target="bio-${member.id}">
              Read Full Bio 
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>
      `;
      }).join('');

      // Observe new team cards for scroll reveal animation
      document.querySelectorAll('#teamGrid .reveal').forEach(el => revealObserver.observe(el));
    }
  }
  // Logos Marquee
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack && logos && logos.length > 0) {
    const renderLogos = () => logos.map(src => `
      <div class="marquee-item">
        <img src="${src}" alt="Client Logo" />
      </div>
    `).join('');

    // Render twice for seamless loop
    marqueeTrack.innerHTML = renderLogos() + renderLogos();
  }
};
populateContent();

// ---------- Contact Form Handling ----------
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    const submitBtn = contactForm.querySelector('.btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Sending...
    `;
    submitBtn.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Show success state
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Message Sent!
      `;
      submitBtn.style.background = '#22C55E';

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
        contactForm.reset();
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      submitBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Error Sending
      `;
      submitBtn.style.background = '#EF4444';

      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      }, 3000);
    }
  });
}

// ---------- Newsletter Form Handling ----------
const newsletterForm = document.getElementById('newsletterForm');
newsletterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = newsletterForm.querySelector('.newsletter-btn');
  const originalText = btn.textContent;
  btn.textContent = 'Subscribed!';
  btn.style.background = '#22C55E';

  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    newsletterForm.reset();
  }, 3000);
});

// ---------- Parallax-lite Hero ----------
window.addEventListener('scroll', () => {
  if (window.innerWidth < 1024) return;
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    const scrolled = window.scrollY;
    heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
}, { passive: true });

// ---------- Active Nav Link Highlight ----------
const sections = document.querySelectorAll('section[id]');
const navLinkElements = document.querySelectorAll('.nav-link');

const navHighlightObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinkElements.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${id}`) {
          link.style.color = '#C5A059';
        }
      });
    }
  });
}, {
  threshold: 0.3,
  rootMargin: '-80px 0px -50% 0px'
});

sections.forEach(section => navHighlightObserver.observe(section));

// ---------- Initial State ----------
handleScroll();
