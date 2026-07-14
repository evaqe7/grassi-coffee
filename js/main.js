// Hero carousel (home)
const heroSlides = document.querySelectorAll('.hero-slide');
if (heroSlides.length) {
  const heroDots = document.querySelectorAll('.hero-dot');
  const prevBtn = document.querySelector('.hero-arrow.prev');
  const nextBtn = document.querySelector('.hero-arrow.next');
  let heroIndex = 0;

  function showHeroSlide(i) {
    heroIndex = (i + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, idx) => slide.classList.toggle('active', idx === heroIndex));
    heroDots.forEach((dot, idx) => dot.classList.toggle('active', idx === heroIndex));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => showHeroSlide(heroIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => showHeroSlide(heroIndex + 1));
  heroDots.forEach((dot, idx) => dot.addEventListener('click', () => showHeroSlide(idx)));
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mainNav.classList.remove('open'));
  });
}

// Language toggle (RO default, RU secondary)
const langButtons = document.querySelectorAll('.lang-toggle button');
const STORAGE_KEY = 'grassi-lang';

function applyLang(lang) {
  document.documentElement.setAttribute('lang', lang === 'ru' ? 'ru' : 'ro');
  document.querySelectorAll('[data-ro]').forEach(el => {
    const text = lang === 'ru' ? el.getAttribute('data-ru') : el.getAttribute('data-ro');
    if (text !== null) el.textContent = text;
  });
  document.querySelectorAll('[data-ro-html]').forEach(el => {
    const html = lang === 'ru' ? el.getAttribute('data-ru-html') : el.getAttribute('data-ro-html');
    if (html !== null) el.innerHTML = html;
  });
  document.querySelectorAll('[data-ro-placeholder]').forEach(el => {
    const ph = lang === 'ru' ? el.getAttribute('data-ru-placeholder') : el.getAttribute('data-ro-placeholder');
    if (ph !== null) el.setAttribute('placeholder', ph);
  });
  langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
  localStorage.setItem(STORAGE_KEY, lang);
}

langButtons.forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

const savedLang = localStorage.getItem(STORAGE_KEY) || 'ro';
applyLang(savedLang);

// Menu category filter (meniu.html)
const pills = document.querySelectorAll('.pill[data-target]');
if (pills.length) {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const target = document.getElementById(pill.dataset.target);
      if (target) {
        const offset = 90;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// Wishlist — saved locally in the browser only. There is no real ordering
// backend yet, this just lets a customer keep a personal shortlist.
const WISHLIST_KEY = 'grassi-wishlist';

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  renderWishlist();
}

function addToWishlist(name, price) {
  const list = getWishlist();
  const existing = list.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    list.push({ name, price, qty: 1 });
  }
  saveWishlist(list);
}

function changeWishlistQty(index, delta) {
  const list = getWishlist();
  if (!list[index]) return;
  list[index].qty += delta;
  if (list[index].qty <= 0) list.splice(index, 1);
  saveWishlist(list);
}

function removeWishlistItem(index) {
  const list = getWishlist();
  list.splice(index, 1);
  saveWishlist(list);
}

let __prevWishlistQty = -1;

function renderWishlist() {
  const list = getWishlist();
  const itemsEl = document.querySelector('.wishlist-items');
  const emptyEl = document.querySelector('.wishlist-empty');
  const countEls = document.querySelectorAll('.wishlist-count');
  const totalEl = document.querySelector('.wishlist-total');
  if (!itemsEl) return;

  const totalQty = list.reduce((sum, item) => sum + item.qty, 0);
  const grew = __prevWishlistQty !== -1 && totalQty > __prevWishlistQty;
  __prevWishlistQty = totalQty;

  countEls.forEach(el => {
    el.textContent = totalQty;
    el.hidden = totalQty === 0;
    if (grew) {
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    }
  });
  if (grew && wishlistToggle) {
    wishlistToggle.classList.remove('bump');
    void wishlistToggle.offsetWidth;
    wishlistToggle.classList.add('bump');
  }

  if (emptyEl) emptyEl.hidden = list.length > 0;
  itemsEl.innerHTML = '';

  let priced = 0;
  let unpriced = 0;
  list.forEach((item, index) => {
    const match = item.price.match(/\d+/);
    if (match) priced += parseInt(match[0], 10) * item.qty;
    else unpriced += item.qty;

    const li = document.createElement('li');
    li.className = 'wishlist-item';
    li.innerHTML = `
      <div>
        <div class="wishlist-item-name">${item.name}</div>
        <div class="wishlist-item-price">${item.price}</div>
      </div>
      <div class="wishlist-item-qty">
        <button class="wishlist-qty-btn" data-action="dec" type="button" aria-label="-">−</button>
        <span>${item.qty}</span>
        <button class="wishlist-qty-btn" data-action="inc" type="button" aria-label="+">+</button>
        <button class="wishlist-remove" data-action="remove" type="button" aria-label="Remove">✕</button>
      </div>`;
    li.querySelector('[data-action="dec"]').addEventListener('click', () => changeWishlistQty(index, -1));
    li.querySelector('[data-action="inc"]').addEventListener('click', () => changeWishlistQty(index, 1));
    li.querySelector('[data-action="remove"]').addEventListener('click', () => removeWishlistItem(index));
    itemsEl.appendChild(li);
  });

  if (totalEl) {
    const lang = document.documentElement.getAttribute('lang');
    let text = `${priced} MDL`;
    if (unpriced > 0) {
      text += lang === 'ru' ? ` + ${unpriced} без цены` : ` + ${unpriced} fără preț`;
    }
    totalEl.textContent = text;
  }
}

const wishlistToggle = document.querySelector('.wishlist-toggle');
const wishlistDrawer = document.querySelector('.wishlist-drawer');
const wishlistOverlay = document.querySelector('.wishlist-overlay');
const wishlistClose = document.querySelector('.wishlist-close');
const wishlistClear = document.querySelector('.wishlist-clear');

function openWishlist() {
  if (wishlistDrawer) wishlistDrawer.classList.add('open');
  if (wishlistOverlay) wishlistOverlay.classList.add('open');
}
function closeWishlist() {
  if (wishlistDrawer) wishlistDrawer.classList.remove('open');
  if (wishlistOverlay) wishlistOverlay.classList.remove('open');
}
if (wishlistToggle) wishlistToggle.addEventListener('click', openWishlist);
if (wishlistClose) wishlistClose.addEventListener('click', closeWishlist);
if (wishlistOverlay) wishlistOverlay.addEventListener('click', closeWishlist);
if (wishlistClear) {
  wishlistClear.addEventListener('click', () => {
    saveWishlist([]);
  });
}
renderWishlist();

// "To cart" buttons — adds the item to the wishlist drawer above
document.querySelectorAll('.btn-cart').forEach(btn => {
  const roLabel = btn.getAttribute('data-ro');
  const ruLabel = btn.getAttribute('data-ru');
  btn.addEventListener('click', () => {
    if (btn.dataset.busy) return;
    btn.dataset.busy = '1';

    const card = btn.closest('.menu-card, .item-card');
    if (card) {
      const nameEl = card.querySelector('h4').cloneNode(true);
      nameEl.querySelectorAll('.section-tag').forEach(tag => tag.remove());
      const name = nameEl.textContent.trim();
      const priceEl = card.querySelector('.card-actions .price');
      const price = priceEl ? priceEl.textContent.trim() : '';
      addToWishlist(name, price);
      openWishlist();
    }

    const lang = document.documentElement.getAttribute('lang');
    btn.textContent = lang === 'ru' ? 'Добавлено ✓' : 'Adăugat ✓';
    btn.classList.add('added');
    setTimeout(() => {
      btn.textContent = lang === 'ru' ? ruLabel : roLabel;
      btn.classList.remove('added');
      delete btn.dataset.busy;
    }, 1200);
  });
});

// Footer year
document.querySelectorAll('.current-year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

// Contact form (static — no backend yet)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const note = document.getElementById('form-note');
    const lang = document.documentElement.getAttribute('lang');
    note.textContent = lang === 'ru'
      ? 'Спасибо! Это демо-форма — подключите её к своей почте или CRM, чтобы получать сообщения.'
      : 'Mulțumim! Acesta este un formular demo — conectează-l la email sau CRM ca să primești mesajele.';
    note.style.display = 'block';
    contactForm.reset();
  });
}

// Scroll-reveal — fade/rise elements in as they enter the viewport, staggered per grid
(function initScrollReveal() {
  const selector = [
    '.menu-card', '.item-card', '.value-card', '.location-card',
    '.price-table-wrap', '.review-strip', '.promo-band', '.cta-band',
    '.contact-info-card', '#contact-form', '.section-head'
  ].join(',');
  const targets = document.querySelectorAll(selector);
  if (!targets.length) return;

  // stagger index within each shared parent (menu grids, value grids, etc.)
  const counters = new Map();
  targets.forEach(el => {
    const parent = el.parentElement;
    const i = counters.get(parent) || 0;
    el.style.setProperty('--reveal-i', Math.min(i, 8));
    counters.set(parent, i + 1);
  });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();

// Animated counters — the big numbers in hero-stats / review-score count up once visible
(function initCounters() {
  const targets = document.querySelectorAll('.hero-stats strong, .review-score strong');
  if (!targets.length || !('IntersectionObserver' in window)) return;

  function animateCount(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/^([\d.,]+)(.*)$/);
    if (!match) return;
    const usesComma = match[1].includes(',');
    const numStr = match[1].replace(',', '.');
    const target = parseFloat(numStr);
    const decimals = (numStr.split('.')[1] || '').length;
    const suffix = match[2];
    if (isNaN(target)) return;

    const duration = 900;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = (target * eased).toFixed(decimals);
      el.textContent = (usesComma ? value.replace('.', ',') : value) + suffix;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  targets.forEach(el => observer.observe(el));
})();

// Back to top button — created dynamically so it works on every page
(function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
