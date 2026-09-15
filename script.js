/* ============================================================
   DAN — build.js
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     CONFIG — set the email the form sends to. FormSubmit sends an
     activation email to this address the first time the form is used.
     ============================================================ */
  const CONFIG = {
    accessKey: '204761c7-4073-4e7c-a6c1-3ce6e6f21801',
    contactEmail: 'dan.designs1@outlook.com'
  };

  const FORM_ENDPOINT = 'https://api.web3forms.com/submit';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav scroll state + mobile menu ---------- */
  const navbar = document.getElementById('navbar');
  const burger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !burger.contains(e.target)) {
      closeMenu();
    }
  });

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => ro.observe(el));
  }

  /* ---------- modals: open/close + focus trap ---------- */
  const formModal = document.getElementById('formModal');
  const projectModal = document.getElementById('projectModal');
  let lastFocused = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable(modal) {
    return Array.prototype.filter.call(modal.querySelectorAll(FOCUSABLE), (el) => {
      return el.offsetParent !== null;
    });
  }

  const trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const modal = (!formModal.hidden) ? formModal : ((!projectModal.hidden) ? projectModal : null);
    if (!modal) return;
    const focusables = getFocusable(modal);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  document.addEventListener('keydown', trapHandler);

  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const focusable = getFocusable(modal);
    const target = (modal === projectModal) ? modal.querySelector('#projectContent h3') : null;
    const firstField = focusable[0];
    setTimeout(() => {
      if (target) target.focus({ preventScroll: true });
      else if (firstField) firstField.focus();
      else modal.focus();
    }, 50);
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function handleEsc(e) {
    if (e.key === 'Escape') {
      if (!formModal.hidden) closeModal(formModal);
      else if (!projectModal.hidden) closeModal(projectModal);
    }
  }
  document.addEventListener('keydown', handleEsc);

  function openFormModal() {
    const form = document.getElementById('commissionForm');
    const formView = document.getElementById('formView');
    const sentView = document.getElementById('sentView');
    formView.hidden = false;
    sentView.hidden = true;
    if (form) form.reset();
    clearAllFieldErrors();
    openModal(formModal);
  }

  document.querySelectorAll('[data-close-form]').forEach((el) => {
    el.addEventListener('click', () => closeModal(formModal));
  });

  document.querySelectorAll('[data-close-project]').forEach((el) => {
    el.addEventListener('click', () => closeModal(projectModal));
  });

  /* delegated clicks cover dynamically injected CTA buttons */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-form]')) openFormModal();
  });

  /* ---------- work data (honest: no fabricated clients) ---------- */
  const projects = [
    {
      title: 'Dan Portfolio',
      category: 'Portfolio · Design & Development',
      tag: 'Self-Initiated',
      image: 'assets/shots/portfolio.png',
      imageAlt: 'Preview of the Dan Portfolio one-page site',
      desc: 'A personal portfolio site with a dark, minimal identity — designed and built to be the homepage for this exact business.',
      goal: 'Create a clean, single-page portfolio that could work as the business homepage for Dan.',
      designed: 'Dark premium identity, restrained accent color, clear hierarchy between name, work, and contact.',
      built: 'One-page HTML/CSS build. No frameworks, no build step — just files that load fast.',
      tech: ['HTML', 'CSS', 'Responsive design', 'Dark UI'],
      perks: ['Dark premium identity', 'Responsive layout', 'Built and deployable']
    },
    {
      title: 'Landing Starter',
      category: 'Landing Page · Design & Development',
      tag: 'Practice Project',
      image: 'assets/shots/landing.png',
      imageAlt: 'Preview of the Landing Starter single-page layout',
      desc: 'A focused single-page landing layout with hero, features, and pricing sections — the backbone of most client work.',
      goal: 'Build a reusable landing-page structure centered on a strong hero and a clear path to a call to action.',
      designed: 'Hero-first layout with feature grid and pricing section, designed to guide a visitor toward one action.',
      built: 'Static HTML/CSS landing page. Mobile responsive and dependency-free.',
      tech: ['HTML', 'CSS', 'Responsive design', 'Landing layout'],
      perks: ['Hero + features + pricing', 'Fully responsive', 'No framework, fast load']
    },
    {
      title: 'Commission Studio',
      category: 'Website · Design & Development',
      tag: 'Practice Project',
      image: 'assets/shots/commission-studio.png',
      imageAlt: 'Preview of the Commission Studio site (this website)',
      desc: 'The site you are looking at right now — a conversion-focused build with services, process, pricing, and a working brief form.',
      goal: 'Turn a visual concept into a functional business site with a real path from visitor to inquiry.',
      designed: 'Full landing structure: hero, portfolio, services, process, pricing, FAQ, and project request form.',
      built: 'Static site with interactive portfolio cards, detail modals, and a submission form wired to an email endpoint.',
      tech: ['HTML', 'CSS', 'JavaScript', 'FormSubmit'],
      perks: ['Conversion-focused structure', 'Working project form', 'Accessible and responsive']
    }
  ];

  const workGrid = document.getElementById('workGrid');

  workGrid.innerHTML = projects.map((p, i) => `
    <article class="work-card reveal" data-project="${i}">
      <div class="work-preview">
        <img src="${p.image}" alt="${p.imageAlt}" loading="lazy">
      </div>
      <div class="work-body">
        <div class="work-meta">
          <span class="work-cat">${p.category}</span>
          <span class="work-tag">${p.tag}</span>
        </div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <button class="work-link" data-project-view="${i}">View Project →
        </button>
      </div>
    </article>`).join('');

  workGrid.addEventListener('click', (e) => {
    const link = e.target.closest('[data-project-view]');
    if (!link) return;
    openProjectModal(projects[Number(link.dataset.projectView)]);
  });

  function openProjectModal(p) {
    document.getElementById('projectContent').innerHTML = `
      <div class="project-detail">
        <div class="pd-shot">
          <img src="${p.image}" alt="${p.imageAlt}">
        </div>
        <h3>${p.title}</h3>
        <div class="pd-meta">${p.category} · ${p.tag}</div>

        <div class="pd-section">
          <h4>The goal</h4>
          <p>${p.goal}</p>
        </div>
        <div class="pd-section">
          <h4>What I designed</h4>
          <p>${p.designed}</p>
        </div>
        <div class="pd-section">
          <h4>What I built</h4>
          <p>${p.built}</p>
        </div>
        <div class="pd-section">
          <h4>Tools & technologies</h4>
          <ul class="pd-tech">${p.tech.map((t) => `<li>${t}</li>`).join('')}</ul>
        </div>

        <button class="btn btn-primary btn-block" data-open-form>Start a Project →</button>
      </div>`;
    projectModal.hidden = false;
    openModal(projectModal);
  }

  document.querySelectorAll('[data-close-project]').forEach((el) => {
    el.addEventListener('click', () => closeModal(projectModal));
  });

  /* ---------- form validation + real submission ---------- */
  const form = document.getElementById('commissionForm');
  const errorsBox = document.getElementById('formErrors');
  const formView = document.getElementById('formView');
  const sentView = document.getElementById('sentView');
  const submitBtn = form.querySelector('button[type="submit"]');

  const fields = {
    name: { el: document.getElementById('f-name'), error: document.getElementById('f-name-error'), validate: (v) => v.trim().length >= 2, msg: 'Please enter your name.' },
    email: { el: document.getElementById('f-email'), error: document.getElementById('f-email-error'), validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Please enter a valid email address.' },
    type: { el: document.getElementById('f-type'), error: document.getElementById('f-type-error'), validate: (v) => v !== '', msg: 'Please choose a project type.' },
    desc: { el: document.getElementById('f-desc'), error: document.getElementById('f-desc-error'), validate: (v) => v.trim().length >= 20, msg: 'Please describe your project (at least a couple of sentences).' },
    budget: { el: document.getElementById('f-budget'), error: null, validate: () => true, msg: '' },
    references: { el: document.getElementById('f-refs'), error: null, validate: () => true, msg: '' },
    deadline: { el: document.getElementById('f-deadline'), error: null, validate: () => true, msg: '' }
  };

  function validateField(name) {
    const f = fields[name];
    const ok = f.validate(f.el.value);
    f.el.classList.toggle('invalid', !ok);
    if (f.error && !ok) f.error.classList.add('show');
    else if (f.error) f.error.classList.remove('show');
    return ok;
  }

  function clearFieldError(name) {
    const f = fields[name];
    f.el.classList.remove('invalid');
    if (f.error) f.error.classList.remove('show');
  }

  function clearAllFieldErrors() {
    Object.keys(fields).forEach((name) => clearFieldError(name));
    errorsBox.hidden = true;
  }

  Object.keys(fields).forEach((name) => {
    const f = fields[name];
    f.el.addEventListener('input', () => clearFieldError(name));
    f.el.addEventListener('change', () => clearFieldError(name));
  });

  function renderErrorSummary(invalidNames) {
    const links = invalidNames.map((n) => {
      const f = fields[n];
      return `<a href="#${f.el.id}">${f.msg}</a>`;
    }).join('');
    errorsBox.innerHTML = `<p>There is a problem</p>${links}`;
    errorsBox.hidden = false;
    errorsBox.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors();

    const invalid = [];
    Object.keys(fields).forEach((name) => {
      if (!validateField(name)) invalid.push(name);
    });

    if (invalid.length) {
      renderErrorSummary(invalid);
      return;
    }

    const payload = {
      access_key: CONFIG.accessKey,
      subject: 'New project request — Dan site',
      from_name: 'Dan website form',
      name: fields.name.el.value.trim(),
      email: fields.email.el.value.trim(),
      project_type: fields.type.el.value,
      budget: fields.budget.el.value || 'Not specified',
      description: fields.desc.el.value.trim(),
      references: fields.references.el.value || 'None',
      deadline: fields.deadline.el.value || 'No deadline'
    };

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      if (CONFIG.accessKey.includes('YOUR-ACCESS-KEY')) {
        throw new Error('Form is not connected yet — edit CONFIG.accessKey in script.js');
      }
      if (window.location.protocol === 'file:') {
        throw new Error('Open the site through Live Server (http://127.0.0.1:5500), not by double-clicking the file.');
      }
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.success !== true) {
        throw new Error('The request could not be sent right now.');
      }

      formView.hidden = true;
      sentView.hidden = false;
      const sentHeading = sentView.querySelector('h2');
      sentHeading.focus({ preventScroll: true });
      form.reset();
    } catch (err) {
      clearAllFieldErrors();
      errorsBox.innerHTML = `<p>Couldn't send your request.</p><a href="mailto:${CONFIG.contactEmail}">${err.message} Email me directly instead →</a>`;
      errorsBox.hidden = false;
      errorsBox.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

})();