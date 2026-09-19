/* ============================================================
   DAN — build script
   Static, no build step. Three.js pulled from a CDN import map.
   ============================================================ */
import * as THREE from 'three';

(() => {
  'use strict';

  window.__booted = true;
  const docEl = document.documentElement;
  const isFile = window.location.protocol === 'file:';
  // Site owner explicitly wants full motion here, so the OS reduced-motion
  // hint (Windows "Animation effects off") is ignored by default. Flip to
  // true to honor prefers-reduced-motion instead.
  const HONOR_REDUCED = false;
  const reducedMotion = HONOR_REDUCED && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) docEl.classList.add('rm');
  const finePointer = window.matchMedia('(any-pointer: fine)').matches;

  const CONFIG = {
    accessKey: '204761c7-4073-4e7c-a6c1-3ce6e6f21801',
    contactEmail: 'dan.designs1@outlook.com'
  };
  const FORM_ENDPOINT = 'https://api.web3forms.com/submit';

  const $ = (id) => document.getElementById(id);

  /* ============================================================
     LOADER
     ============================================================ */
  const loader = $('loader');
  const bootTime = performance.now();
  let hiddenLoader = false;

  function hideLoader() {
    if (hiddenLoader) return;
    hiddenLoader = true;
    const wait = Math.max(0, 500 - (performance.now() - bootTime));
    setTimeout(() => {
      if (loader) { loader.classList.add('hide'); setTimeout(() => loader.remove(), 700); }
      docEl.classList.add('loaded');
    }, wait);
  }

  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader, { once: true });
  setTimeout(hideLoader, 2500); // safety net — never trap the user

  if (isFile) {
    console.warn('[dandesigns] Open via a local server or GitHub Pages — file:// blocks module scripts.');
    return;
  }

  /* ============================================================
     CUSTOM CURSOR (fine pointers only)
     ============================================================ */
  const curDot = $('curDot');
  const curRing = $('curRing');
  const labelEl = document.createElement('span');
  labelEl.className = 'cursor-label';
  if (curRing) curRing.appendChild(labelEl);

  const INTERACTIVE = 'a, button, summary, input, select, textarea, .work-card, [data-cursor]';

  let cx = -100, cy = -100;

  if (curDot && curRing && finePointer && !reducedMotion) {
    docEl.classList.add('cursor-on');

    let dotX = -100, dotY = -100;
    let ringX = -100, ringY = -100;

    window.addEventListener('pointermove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const hit = e.target.closest(INTERACTIVE);
      curRing.classList.toggle('is-hover', !!hit);
      const lbl = hit && hit.closest('[data-cursor-label]');
      if (lbl) {
        labelEl.textContent = lbl.dataset.cursorLabel;
        curRing.classList.add('is-label');
      } else {
        curRing.classList.remove('is-label');
      }
    });

    (function cursorLoop() {
      dotX += (cx - dotX) * 0.42;
      dotY += (cy - dotY) * 0.42;
      ringX += (cx - ringX) * 0.16;
      ringY += (cy - ringY) * 0.16;
      curDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;
      curRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(cursorLoop);
    })();
  }

  /* ============================================================
     MAGNETIC BUTTONS
     ============================================================ */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const px = Math.max(-7, Math.min(7, dx * 0.16));
        const py = Math.max(-5, Math.min(5, dy * 0.28));
        btn.style.transform = `translate(${px}px, ${py}px)`;
      });
      const reset = () => { btn.style.transform = ''; };
      btn.addEventListener('pointerleave', reset);
      btn.addEventListener('pointerdown', reset);
    });
  }

  /* ============================================================
     NAV + SCROLLBOOK
     ============================================================ */
  const navbar = $('navbar');
  const burger = $('hamburger');
  const navLinks = $('navLinks');
  const progressBar = $('scrollProgress');

  function onScrollState() {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScrollState, { passive: true });

  function closeMenu() {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger) {
    burger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
  }
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !burger.contains(e.target)) closeMenu();
  });

  /* ---------- animated scroll to section ---------- */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  /* sections whose nav target is a sub-block, not the section top */
  const SECTION_TARGETS = {
    pricing: '#pricing .pricing-grid'
  };

  function scrollToSection(id, jumpEl) {
    const sub = SECTION_TARGETS[id];
    let target = document.getElementById(id);
    if (sub) target = document.querySelector(sub) || target;
    if (!target) return;
    const offset = Math.min(navbar ? navbar.offsetHeight : 0, 72) + 18;
    const startY = window.scrollY;
    const endY = Math.max(0, target.getBoundingClientRect().top + startY - offset);

    if (reducedMotion || endY === startY) {
      window.scrollTo({ top: endY, behavior: 'auto' });
      if (jumpEl) jumpEl.classList.remove('is-jumping');
      return;
    }

    const dur = Math.min(1300, Math.max(550, Math.abs(endY - startY) * 0.5));
    const startT = performance.now();

    let raf;
    let waitT = null;
    if (jumpEl) {
      waitT = setTimeout(() => jumpEl.classList.add('is-jumping'), 500);
    }
    const finish = () => {
      cancelAnimationFrame(raf);
      if (waitT) clearTimeout(waitT);
      if (jumpEl) {
        jumpEl.classList.remove('is-jumping');
        jumpEl.classList.remove('is-clicked');
      }
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchstart', finish);
    };
    window.addEventListener('wheel', finish, { passive: true, once: true });
    window.addEventListener('touchstart', finish, { passive: true, once: true });

    const step = (now) => {
      const t = Math.min(1, (now - startT) / dur);
      window.scrollTo(0, startY + (endY - startY) * easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        history.replaceState(null, '', '#' + id);
        finish();
      }
    };
    raf = requestAnimationFrame(step);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    a.classList.add('is-clicked');
    setTimeout(() => a.classList.remove('is-clicked'), 500);
    if (navLinks.classList.contains('open')) {
      closeMenu();
      setTimeout(() => scrollToSection(id, a), 90);
    } else {
      scrollToSection(id, a);
    }
  });

  /* ============================================================
     REVEAL SYSTEM
     ============================================================ */
  function assignRevealDefaults() {
    document.querySelectorAll('.reveal').forEach((el) => {
      if (!el.dataset.reveal) {
        const inHead = !!el.closest('.section-head');
        el.dataset.reveal = inHead ? 'mask' : 'up';
      }
      const sibs = Array.prototype.filter.call(el.parentElement.children, (s) => s.classList.contains('reveal'));
      const idx = sibs.indexOf(el);
      el.style.setProperty('--d', `${Math.min(idx, 6) * 70}ms`);
    });
  }

  function initReveal() {
    assignRevealDefaults();
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => ro.observe(el));
  }
  initReveal();

  /* ============================================================
     PARALLAX (restrained, desktop + fine pointer only)
     ============================================================ */
  const plxEls = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  const usePlx = finePointer && !reducedMotion && window.innerWidth > 768 && plxEls.length;

  function updateParallax() {
    if (!usePlx) return;
    const vh = window.innerHeight;
    const half = vh / 2;
    for (const el of plxEls) {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - half;
      const speed = parseFloat(el.dataset.plx) || 0.1;
      el.style.transform = `translate3d(0, ${(mid * speed).toFixed(1)}px, 0)`;
    }
  }

  let plxRaf = null;
  function scheduleParallax() {
    if (plxRaf) return;
    plxRaf = requestAnimationFrame(() => { plxRaf = null; updateParallax(); });
  }
  if (usePlx) window.addEventListener('scroll', scheduleParallax, { passive: true });
  if (usePlx) updateParallax();

  /* ============================================================
     MODALS + FOCUS TRAP
     ============================================================ */
  const formModal = $('formModal');
  const projectModal = $('projectModal');
  let lastFocused = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusable(modal) {
    return Array.prototype.filter.call(modal.querySelectorAll(FOCUSABLE), (el) => el.offsetParent !== null);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!formModal.hidden) closeModal(formModal);
      else if (!projectModal.hidden) closeModal(projectModal);
      return;
    }
    if (e.key !== 'Tab') return;
    const activeModal = (!formModal.hidden) ? formModal : ((!projectModal.hidden) ? projectModal : null);
    if (!activeModal) return;
    const f = getFocusable(activeModal);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  function openModal(modal) {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const f = getFocusable(modal);
    const target = (modal === projectModal) ? modal.querySelector('#projectContent h3') : null;
    setTimeout(() => { (target || f[0] || modal).focus({ preventScroll: true }); }, 60);
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-close-form]').forEach((el) => el.addEventListener('click', () => closeModal(formModal)));
  document.querySelectorAll('[data-close-project]').forEach((el) => el.addEventListener('click', () => closeModal(projectModal)));
  document.addEventListener('click', (e) => { if (e.target.closest('[data-open-form]')) openFormModal(); });

  /* ============================================================
     WORK DATA (honest: no fabricated clients)
     ============================================================ */
  const projects = [
    {
      title: 'Dan Portfolio',
      category: 'Portfolio · Design & Development',
      tag: 'Self-Initiated',
      image: 'assets/shots/portfolio.png',
      imageAlt: 'Preview of the Dan Portfolio one-page site',
      desc: 'A personal portfolio site with a dark, minimal identity — designed and built to be the homepage for this exact business.',
      challenge: 'A one-page personal site needed to feel premium and confident without relying on stock templates or filler — and it had to load fast.',
      direction: 'Dark, minimal identity with a restrained accent, clear hierarchy between name, work, and contact, and no decorative clutter.',
      build: 'One-page HTML/CSS build with no frameworks and no build step — a handful of static files.',
      result: 'A deployable, responsive single-page site that now serves as this business homepage.',
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
      challenge: 'Most businesses need one clear landing page — but starting from scratch each time is slow. The goal was a proven, reusable structure.',
      direction: 'Hero-first layout with a feature grid and pricing section, built to guide a visitor toward exactly one action.',
      build: 'Static HTML/CSS landing page. Mobile responsive and dependency-free, ready to adapt per client.',
      result: 'A reusable landing skeleton that handles the common 80% of client landing work out of the box.',
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
      challenge: 'A visual-only concept needed to become a fully functional business site with a real path from visitor to inquiry.',
      direction: 'Full landing structure: hero, portfolio, services, process, pricing, FAQ, and a project request form.',
      build: 'Static site with interactive portfolio cards, detail modals, and a submission form wired to an email endpoint.',
      result: 'A working, deployed site — visitor to inquiry flow is live, from landing page through to a form that actually delivers briefs.',
      tech: ['HTML', 'CSS', 'JavaScript', 'Web3Forms'],
      perks: ['Conversion-focused structure', 'Working project form', 'Accessible and responsive']
    }
  ];

  const workGrid = $('workGrid');
  workGrid.innerHTML = projects.map((p, i) => `
    <article class="work-card${i === 0 ? ' featured' : ''}" data-project="${i}">
      <span class="work-index" aria-hidden="true">0${i + 1}</span>
      <div class="work-visual">
        <img src="${p.image}" alt="${p.imageAlt}" loading="lazy" width="1200" height="760">
      </div>
      <div class="work-meta">
        <span class="work-cat">${p.category}</span>
        <span class="work-tag">${p.tag}</span>
      </div>
      <div class="work-copy">
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <button class="work-link" data-project-view="${i}" data-cursor-label="VIEW">View case study <span aria-hidden="true">&rarr;</span></button>
      </div>
    </article>`).join('');

  initReveal();

  workGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-project-view]');
    if (!btn) return;
    openProjectModal(projects[Number(btn.dataset.projectView)]);
  });

  function openProjectModal(p) {
    $('projectContent').innerHTML = `
      <div class="project-detail">
        <div class="pd-shot">
          <img src="${p.image}" alt="${p.imageAlt}">
        </div>
        <h3>${p.title}</h3>
        <div class="pd-meta">${p.category} · ${p.tag}</div>
        <div class="pd-section"><h4>The Challenge</h4><p>${p.challenge}</p></div>
        <div class="pd-section"><h4>The Direction</h4><p>${p.direction}</p></div>
        <div class="pd-section"><h4>The Build</h4><p>${p.build}</p></div>
        <div class="pd-section"><h4>The Result</h4><p>${p.result}</p></div>
        <div class="pd-section">
          <h4>Tools &amp; technologies</h4>
          <ul class="pd-tech">${p.tech.map((t) => `<li>${t}</li>`).join('')}</ul>
        </div>
        <button class="btn btn-primary btn-block" data-open-form>Start a Project &rarr;</button>
      </div>`;
    projectModal.hidden = false;
    openModal(projectModal);
  }

  /* ---------- form modal ---------- */
  function openFormModal() {
    const form = $('commissionForm');
    $('formView').hidden = false;
    $('sentView').hidden = true;
    if (form) form.reset();
    clearAllFieldErrors();
    openModal(formModal);
  }

  /* ============================================================
     FORM VALIDATION + SUBMISSION
     ============================================================ */
  const form = $('commissionForm');
  const errorsBox = $('formErrors');
  const formView = $('formView');
  const sentView = $('sentView');
  const submitBtn = form.querySelector('button[type="submit"]');

  const MSG = {
    name: 'Please enter your name.',
    email: 'Please enter a valid email address.',
    type: 'Please choose a project type.',
    desc: 'Please describe your project (at least a couple of sentences).'
  };

  const fields = {
    name: { el: $('f-name'), error: $('f-name-error'), validate: (v) => v.trim().length >= 2 },
    email: { el: $('f-email'), error: $('f-email-error'), validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    type: { el: $('f-type'), error: $('f-type-error'), validate: (v) => v !== '' },
    desc: { el: $('f-desc'), error: $('f-desc-error'), validate: (v) => v.trim().length >= 20 },
    budget: { el: $('f-budget'), error: null, validate: () => true },
    references: { el: $('f-refs'), error: null, validate: () => true },
    deadline: { el: $('f-deadline'), error: null, validate: () => true }
  };

  function validateField(name) {
    const f = fields[name];
    const ok = f.validate(f.el.value);
    f.el.classList.toggle('invalid', !ok);
    if (f.error) f.error.classList.toggle('show', !ok);
    return ok;
  }

  function clearFieldError(name) {
    const f = fields[name];
    f.el.classList.remove('invalid');
    if (f.error) f.error.classList.remove('show');
  }

  function clearAllFieldErrors() {
    Object.keys(fields).forEach(clearFieldError);
    errorsBox.hidden = true;
  }

  Object.keys(fields).forEach((name) => {
    const f = fields[name];
    f.el.addEventListener('input', () => clearFieldError(name));
    f.el.addEventListener('change', () => clearFieldError(name));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors();

    const invalid = Object.keys(fields).filter((name) => {
      const bad = !validateField(name);
      return bad && fields[name].error;
    });

    if (invalid.length) {
      errorsBox.innerHTML = `<p>There is a problem</p>${invalid.map((n) => `<a href="#${fields[n].el.id}">${MSG[n]}</a>`).join('')}`;
      errorsBox.hidden = false;
      errorsBox.focus();
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
      if (CONFIG.accessKey.includes('YOUR-ACCESS-KEY')) throw new Error('Form is not connected yet — edit CONFIG.accessKey in script.js');
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.success !== true) throw new Error('The request could not be sent right now.');

      formView.hidden = true;
      sentView.hidden = false;
      sentView.querySelector('h2').focus({ preventScroll: true });
      form.reset();
    } catch (err) {
      clearAllFieldErrors();
      errorsBox.innerHTML = `<p>Couldn't send your request.</p><a href="mailto:${CONFIG.contactEmail}">${err.message} Email me directly instead &rarr;</a>`;
      errorsBox.hidden = false;
      errorsBox.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  /* ============================================================
     THREE.JS — interactive layered object
     One canvas, one scene. Hero idle + cursor reaction, then a
     scroll-driven "disassembly" inside the experiment section.
     ============================================================ */
  const stage = $('stage');
  const experimentEl = $('experiment');
  const kineticState = $('kineticState');

  const use3D = !reducedMotion && !isFile && !!stage && (!!window.WebGLRenderingContext || !!window.WebGL2RenderingContext);

  let renderer, scene, camera, tower;
  let coreMat, innerLine, halo, particles;
  let rings = [], slabs = [];
  let curNX = 0, curNY = 0;
  let mode = 0;
  let isMobile = window.innerWidth < 768;

  const STATE_NAMES = [
    ['ASSEMBLING', 0.10],
    ['ROTATING', 0.34],
    ['LAYERING', 0.62],
    ['LIGHT: PASS', 0.86],
    ['SHIPPED', 1.001]
  ];
  let lastState = '';

  const lerp = (a, b, k) => a + (b - a) * k;

  function experimentProgress() {
    if (!experimentEl) return 0;
    const elTop = experimentEl.offsetTop;
    const span = Math.max(1, experimentEl.offsetHeight - window.innerHeight);
    return Math.max(0, Math.min(1, (window.pageYOffset - elTop) / span));
  }

  if (use3D) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: stage, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 60);
      camera.position.set(0, 0, 8.2);

      tower = new THREE.Group();
      scene.add(tower);

      /* glass core — fresnel shader */
      coreMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(0x101013) },
          uAccent: { value: new THREE.Color(0xc3a97e) },
          uAlpha: { value: 0.9 }
        },
        vertexShader: `
          varying vec3 vN; varying vec3 vP; varying vec2 vUv;
          void main() {
            vN = normalize(position);
            vP = position;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform float uTime; uniform vec3 uColor; uniform vec3 uAccent; uniform float uAlpha;
          varying vec3 vN; varying vec3 vP; varying vec2 vUv;
          void main() {
            float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vP))), 2.4);
            float ripple = sin(vUv.y * 14.0 + uTime * 0.5) * 0.012;
            vec3 col = mix(uColor, uAccent, clamp(fres * 1.35, 0.0, 1.0));
            col += uAccent * fres * fres * 0.5;
            float alpha = clamp(uAlpha * (0.28 + fres * 0.95), 0.0, 1.0);
            gl_FragColor = vec4(col, alpha);
          }`
      });

      const core = new THREE.Mesh(new THREE.BoxGeometry(0.82, 3.3, 0.82), coreMat);
      tower.add(core);

      /* inner lattice — elongated wireframe icosahedron */
      innerLine = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.7, 1), 30),
        new THREE.LineBasicMaterial({ color: 0xc3a97e, transparent: true, opacity: 0.75 })
      );
      innerLine.scale.set(1, 1.7, 1);
      tower.add(innerLine);

      /* halo — faint brass core glow */
      halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xc3a97e, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      halo.scale.set(1, 1.75, 1);
      tower.add(halo);

      /* layered slabs — they unlock in the experiment section */
      const slabGeo = new THREE.BoxGeometry(1.04, 0.085, 1.04);
      [-1.15, 0, 1.15].forEach((y, i) => {
        const m = new THREE.Mesh(
          slabGeo,
          new THREE.MeshBasicMaterial({ color: 0xe6e2d8, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
        );
        m.position.y = y;
        m.rotation.y = i * 0.35;
        m.userData.baseX = (i === 0 ? -0.9 : i === 2 ? 0.9 : 0);
        tower.add(m);
        slabs.push(m);
      });

      /* orbital rings */
      const ringMatW = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
      const ringMatB = new THREE.MeshBasicMaterial({ color: 0xc3a97e, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.008, 6, 140), ringMatW);
      r1.rotation.x = Math.PI / 2.4;
      tower.add(r1);
      const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.006, 6, 140), ringMatB);
      r2.rotation.x = Math.PI / 1.9;
      r2.rotation.y = 0.6;
      tower.add(r2);
      rings = [r1, r2];

      /* particles */
      const N = 150;
      const pGeo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 3.4 * (0.55 + Math.random() * 0.45);
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.cos(ph);
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0xcfc8ba, size: 0.028, transparent: true, opacity: 0.5, sizeAttenuation: true, depthWrite: false })
      );
      tower.add(particles);

      window.addEventListener('pointermove', (e) => {
        curNX = (e.clientX / window.innerWidth) * 2 - 1;
        curNY = -((e.clientY / window.innerHeight) * 2 - 1);
      }, { passive: true });

      window.addEventListener('resize', onResize);
      onResize();

      const clock = new THREE.Clock();
      let running = true;
      document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) { clock.getDelta(); }
      });

      (function tick() {
        requestAnimationFrame(tick);
        if (!running) return;
        const time = clock.getElapsedTime();
        animateScene(time);
        renderer.render(scene, camera);
      })();
    } catch (err) {
      console.warn('[dandesigns] 3D unavailable:', err);
      if (stage) stage.style.display = 'none';
    }
  }

  function onResize() {
    if (!renderer || !camera) return;
    isMobile = window.innerWidth < 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animateScene(time) {
    const p = experimentProgress();
    mode = lerp(mode, p, 0.055);

    /* readout label */
    if (kineticState && mode > 0.02) {
      const th = STATE_NAMES.find((s) => p <= s[1]) || STATE_NAMES[STATE_NAMES.length - 1];
      const idx = STATE_NAMES.indexOf(th) + 1;
      const key = '0' + idx + ' — ' + th[0];
      if (key !== lastState) { kineticState.textContent = key; lastState = key; }
    }

    const aspect = window.innerWidth / window.innerHeight;
    const heroX = (isMobile ? 0.0 : 1.3) * Math.min(aspect, 1.7);
    const heroY = isMobile ? -0.15 : -0.05;

    const posX = heroX + (0 - heroX) * mode;
    const posY = heroY + (0 - heroY) * mode;

    tower.position.x = lerp(tower.position.x, posX, 0.05);
    tower.position.y = lerp(tower.position.y, posY + Math.sin(time * 0.85) * 0.13, 0.05);

    /* rotation */
    const idleRotY = time * 0.07;
    const curRX = curNY * 0.28 * (1 - mode);
    const curRY = curNX * 0.5 * (1 - mode);
    const spinProg = p * Math.PI * 1.6;
    const rotYT = idleRotY + curRY + spinProg + mode * time * 0.14;
    tower.rotation.y = lerp(tower.rotation.y, rotYT, 0.06);
    tower.rotation.x = lerp(tower.rotation.x, curRX + mode * 0.08, 0.06);

    /* scale + camera */
    tower.scale.setScalar(1 + mode * 0.6);
    camera.position.z = lerp(camera.position.z, 8.2 - mode * 1.35, 0.035);

    /* slab unlock */
    slabs.forEach((s) => {
      const tx = s.userData.baseX + s.userData.baseX * mode * 1.1;
      const tz = mode * (s.userData.baseX > 0 ? -0.35 : s.userData.baseX < 0 ? 0.35 : 0);
      s.position.x = lerp(s.position.x, tx, 0.06);
      s.rotation.z = lerp(s.rotation.z, tz, 0.06);
    });

    /* rings */
    rings.forEach((r, i) => { r.rotation.z = time * (i ? -0.25 : 0.18); });

    /* particles */
    particles.scale.setScalar(1 + mode * 0.5);
    particles.rotation.y = time * 0.02;

    /* global fade for mobile readability */
    const a = (isMobile && mode < 0.5) ? 0.42 : 1;
    coreMat.uniforms.uAlpha.value = 0.9 * a;
    coreMat.uniforms.uTime.value = time;
    innerLine.material.opacity = 0.75 * a;
    halo.material.opacity = 0.08 * a;
    particles.material.opacity = 0.5 * a;
  }

})();