/* ==========================================================================
   Veranda — app
   Preloader · page transitions (PJAX) · selection menu · nav menu ·
   Lenis smooth scroll per page · ScrollTrigger reveals
   ========================================================================== */
(() => {
  "use strict";

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create("wipe", "M0,0 C0.73,0.15 0.15,0.99 1,1");
  CustomEase.create("glide", "M0,0 C0.76,0 0.24,1 1,1");
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const html = document.documentElement;
  const stage = $("#stage");

  const CATEGORIES = [
    { key: "sea", name: "By The Sea", href: "by-the-sea.html", color: "#232b57", desc: "Coastal, marina &amp;<br>seafront homes", cover: "assets/img/sea-cover.jpg" },
    { key: "green", name: "Evergreen", href: "evergreen.html", color: "#3c6a4c", desc: "Golf resorts, parks &amp;<br>forest retreats", cover: "assets/img/green-cover.jpg" },
    { key: "urban", name: "Urban Living", href: "urban-living.html", color: "#2e1a2f", desc: "City centre &amp; old town<br>vibes and lifestyle", cover: "assets/img/urban-cover.jpg" },
    { key: "gems", name: "Rare Gems", href: "rare-gems.html", color: "#1d1b20", desc: "One of a kind &amp; unique<br>concept homes", cover: "assets/img/gems-cover.jpg" },
  ];

  const NAV_LINKS = [
    { key: "home", label: "Home", href: "index.html" },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.name, href: c.href })),
    { key: "about", label: "About", href: "about.html" },
    { key: "contact", label: "Contact", href: "contact.html" },
  ];

  const MARK = '<svg class="sel-card__mark" viewBox="0 0 26 16" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M0 7.5h8.5M7 1.5l6 13 6-13"/></svg>';
  const LOGO = '<span class="logo__mark"></span>VERANDA';

  const state = {
    page: null,
    url: location.href,
    busy: false,
    selectionOpen: false,
    navOpen: false,
    cache: new Map(),
  };

  // one ticker drives every Lenis instance
  const lenises = new Set();
  gsap.ticker.add((time) => lenises.forEach((l) => l.raf(time * 1000)));
  gsap.ticker.lagSmoothing(0);

  /* ------------------------------------------------------------------------
     Shell: preloader, selection menu, nav menu
     ------------------------------------------------------------------------ */

  function reel(cls, values) {
    return `<div class="preloader__digit preloader__digit--${cls}"><div class="preloader__reel">${values
      .map((v) => `<span>${v}</span>`)
      .join("")}</div></div>`;
  }

  function buildShell(finalSrc) {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    const frames = [...CATEGORIES.map((c) => c.cover), finalSrc];

    const preloader = `
      <div class="preloader" aria-hidden="true">
        <div class="preloader__bg"></div>
        <div class="preloader__frames">
          ${frames.map((src) => `<div class="preloader__frame"><img src="${src}" alt=""></div>`).join("")}
        </div>
        <div class="preloader__counter">
          <div class="preloader__mask">
            <div class="preloader__digits">${reel("h", [0, 1])}${reel("t", digits)}${reel("o", digits)}</div>
          </div>
        </div>
      </div>`;

    const selection = `
      <nav class="selection" aria-label="Our selection" aria-hidden="true">
        <div class="selection__grid">
          ${CATEGORIES.map(
            (c) => `
            <a class="sel-card" href="${c.href}" data-key="${c.key}" style="--card:${c.color}">
              <span class="sel-card__panel">
                ${MARK}
                <span class="sel-card__desc">${c.desc}</span>
                <span class="sel-card__title">${c.name}</span>
              </span>
              <span class="sel-card__cover"><img src="${c.cover}" alt="" loading="lazy"></span>
            </a>`
          ).join("")}
        </div>
      </nav>`;

    const navmenu = `
      <div class="navmenu" aria-hidden="true" role="dialog" aria-label="Menu">
        <div class="navmenu__top">
          <span>Menu</span>
          <a href="index.html" class="logo" aria-label="Veranda home">${LOGO}</a>
          <button type="button" class="navmenu__close link-u" data-close-nav>Close</button>
        </div>
        <nav class="navmenu__links">
          ${NAV_LINKS.map((l) => `<a href="${l.href}" data-key="${l.key}"><span>${l.label}</span></a>`).join("")}
        </nav>
        <div class="navmenu__foot">
          <div><span>Office</span><a class="link-u" href="mailto:hello@veranda.example">hello@veranda.example</a></div>
          <div><span>Phone</span><a class="link-u" href="tel:+35700000000">+357 00 000 000</a></div>
          <div>Veranda® 2026</div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML("afterbegin", preloader + selection + navmenu);
  }

  /* ------------------------------------------------------------------------
     Page decoration (header + fixed UI are shared, so they're injected)
     ------------------------------------------------------------------------ */

  function decorate(page) {
    const key = page.dataset.page;
    const content = $(".page__content", page);
    content.insertAdjacentHTML(
      "afterbegin",
      `<header class="site-header">
        <a href="about.html" class="site-header__link link-u${key === "about" ? " is-active" : ""}">About</a>
        <a href="index.html" class="logo" aria-label="Veranda home">${LOGO}</a>
        <a href="contact.html" class="site-header__link link-u${key === "contact" ? " is-active" : ""}">Contact</a>
      </header>`
    );
    page.insertAdjacentHTML(
      "beforeend",
      `<div class="ui${page.dataset.theme === "dark" ? " is-dark" : ""}">
        <div class="ui__actions">
          <button type="button" class="btn-selection" data-open-selection aria-haspopup="true">
            <span>Our Selection</span><span class="btn-selection__dots"><i></i><i></i><i></i><i></i></span>
          </button>
          <button type="button" class="btn-menu" data-open-nav aria-label="Open menu">
            <span class="btn-menu__icon"><i></i><i></i></span>
          </button>
        </div>
      </div>
      <div class="page__shade"></div>`
    );
  }

  /* ------------------------------------------------------------------------
     Marquee
     ------------------------------------------------------------------------ */

  function splitChars(el) {
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.innerHTML = [...text]
      .map((ch) =>
        ch === " "
          ? '<span class="char-mask"><span class="char">&nbsp;</span></span>'
          : `<span class="char-mask"><span class="char">${ch}</span></span>`
      )
      .join("");
  }

  function createMarquee(el, v) {
    const track = $(".marquee__track", el);
    const base = $(".marquee__item", track);
    splitChars(base);

    const dir = Number(el.dataset.dir || -1);
    let w = 0;
    let x = 0;
    let boost = 0;

    const fill = () => {
      w = base.offsetWidth;
      const need = Math.ceil((window.innerWidth * 2) / Math.max(w, 1)) + 1;
      while (track.children.length < need) {
        const clone = base.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    };
    fill();
    // start mid-word so the visual sits inside the text, like the reference
    x = -w * 0.38;

    const setX = gsap.quickSetter(track, "x", "px");
    const tick = (_t, dt) => {
      const lenis = v.lenis;
      const vel = lenis ? lenis.velocity : 0;
      const scrollDir = lenis && lenis.direction ? lenis.direction : 1;
      boost += (Math.min(Math.abs(vel), 60) * 0.35 - boost) * 0.08;
      const speed = (window.innerWidth / 1440) * (0.55 + boost) * (dt / 16.667);
      x += speed * dir * scrollDir;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      setX(x);
    };
    gsap.ticker.add(tick);
    const onResize = () => fill();
    window.addEventListener("resize", onResize);
    v.cleanups.push(() => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", onResize);
    });
  }

  /* ------------------------------------------------------------------------
     Page lifecycle
     ------------------------------------------------------------------------ */

  function mountPage(page, { morph = false } = {}) {
    decorate(page);
    const scroller = $(".page__scroll", page);
    const content = $(".page__content", page);
    const v = { scroller, content, cleanups: [], lenis: null, intro: null };
    page._v = v;

    if (!page.classList.contains("page--home")) {
      v.lenis = new Lenis({
        wrapper: scroller,
        content,
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.95,
      });
      v.lenis.stop();
      v.lenis.on("scroll", ScrollTrigger.update);
      lenises.add(v.lenis);
    }

    v.ctx = gsap.context(() => {
      $$("[data-marquee]", page).forEach((el) => createMarquee(el, v));
      prepareIntro(page, morph);
    }, page);
  }

  function prepareIntro(page, morph) {
    const v = page._v;
    const tl = gsap.timeline({ paused: true });

    const chars = $$('[data-intro="chars"] .char', page);
    if (chars.length) {
      gsap.set(chars, { yPercent: 115 });
      tl.to(chars, { yPercent: 0, duration: 1.35, ease: "expo.out", stagger: { amount: 0.55 } }, 0);
    }

    $$('[data-intro="lines"]', page).forEach((el) => {
      const split = SplitText.create(el, { type: "lines", mask: "lines" });
      gsap.set(split.lines, { yPercent: 110 });
      tl.to(split.lines, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 }, 0.3);
    });

    const fades = $$('.site-header > *, .ui__actions, .hero__meta, [data-intro="fade"]', page);
    gsap.set(fades, { autoAlpha: 0, y: 14 });
    tl.to(fades, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.05 }, 0.45);

    const hv = $("[data-hero-visual]", page);
    if (hv) {
      const img = $("img", hv);
      if (morph) {
        gsap.set(hv, { autoAlpha: 0 });
      } else if (hv.dataset.heroVisual === "full") {
        gsap.set(img, { scale: 1.25 });
        tl.to(img, { scale: 1, duration: 2, ease: "expo.out" }, 0);
      } else {
        gsap.set(hv, { clipPath: "inset(50% 50% 50% 50%)" });
        gsap.set(img, { scale: 1.5 });
        tl.fromTo(hv, { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 0)
          .to(img, { scale: 1, duration: 1.9, ease: "expo.out" }, 0.25);
      }
    }

    v.intro = tl;
  }

  function activatePage(page) {
    const v = page._v;
    v.ctx.add(() => setupScroll(page));
    if (v.lenis) v.lenis.start();
    ScrollTrigger.refresh();
    updateUiTheme(page);
  }

  function unmountPage(page) {
    const v = page._v;
    if (!v) return;
    v.cleanups.forEach((fn) => fn());
    v.ctx.revert();
    if (v.lenis) {
      lenises.delete(v.lenis);
      v.lenis.destroy();
    }
    page._v = null;
  }

  /* ------------------------------------------------------------------------
     Scroll-driven animation
     ------------------------------------------------------------------------ */

  function setupScroll(page) {
    const v = page._v;
    const scroller = v.scroller;

    $$('[data-reveal="lines"]', page).forEach((el) => {
      const split = SplitText.create(el, { type: "lines", mask: "lines" });
      gsap.from(split.lines, {
        yPercent: 110,
        duration: 1.3,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: el, scroller, start: "top 88%" },
      });
    });

    $$('[data-reveal="fade"]', page).forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 34,
        duration: 1.3,
        ease: "expo.out",
        scrollTrigger: { trigger: el, scroller, start: "top 92%" },
      });
    });

    $$(".vline", page).forEach((el) => {
      gsap.from(el, {
        scaleY: 0,
        duration: 1.5,
        ease: "expo.inOut",
        scrollTrigger: { trigger: el, scroller, start: "top 92%" },
      });
    });

    $$('[data-reveal="clip"]', page).forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(12% 12% 12% 12%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: { trigger: el, scroller, start: "top bottom", end: "top 25%", scrub: true },
        }
      );
    });

    $$("[data-parallax]", page).forEach((img) => {
      const amt = parseFloat(img.dataset.parallax) || 8;
      gsap.fromTo(
        img,
        { yPercent: -amt },
        {
          yPercent: amt,
          ease: "none",
          scrollTrigger: { trigger: img.parentElement, scroller, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });

    $$("[data-count]", page).forEach((el) => {
      const target = Number(el.dataset.count);
      const o = { n: 0 };
      gsap.to(o, {
        n: target,
        duration: 2,
        ease: "expo.out",
        onUpdate: () => (el.textContent = Math.round(o.n)),
        scrollTrigger: { trigger: el, scroller, start: "top 85%" },
      });
    });

    // category hero: the square grows into a full-bleed frame while the page is pinned
    const catHero = $(".cat-hero", page);
    if (catHero) {
      const hv = $(".hero__visual", catHero);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: catHero,
          scroller,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      tl.to(hv, { width: () => window.innerWidth, height: () => window.innerHeight, top: () => window.innerHeight / 2, ease: "power1.inOut", duration: 1 }, 0)
        .to($(".marquee", catHero), { autoAlpha: 0, ease: "none", duration: 0.3 }, 0)
        .to($(".hero__bottom", catHero), { autoAlpha: 0, y: -50, ease: "none", duration: 0.35 }, 0)
        .to($(".hero__meta", catHero), { autoAlpha: 0, ease: "none", duration: 0.2 }, 0)
        .fromTo($("img", hv), { scale: 1 }, { scale: 1.08, ease: "none", duration: 1.3 }, 0)
        .to({}, { duration: 0.3 });
    }

    const aboutHero = $(".about-hero", page);
    if (aboutHero) {
      gsap.to($(".about-hero__media img", aboutHero), {
        yPercent: 18,
        ease: "none",
        scrollTrigger: { trigger: aboutHero, scroller, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to($(".marquee", aboutHero), {
        yPercent: -120,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: aboutHero, scroller, start: "top top", end: "bottom top", scrub: true },
      });
    }

    $$("[data-gallery]", page).forEach((el) => setupGallery(el, v));
    $$("[data-forms]", page).forEach((el) => setupForms(el));

    const scrollBtn = $("[data-scroll-next]", page);
    if (scrollBtn && v.lenis) {
      scrollBtn.addEventListener("click", () => {
        const next = scrollBtn.closest("section").nextElementSibling;
        if (next) v.lenis.scrollTo(next, { duration: 1.6 });
      });
    }

    if (v.lenis) v.lenis.on("scroll", () => updateUiTheme(page));
  }

  // flips the fixed buttons between light / dark depending on the section beneath them
  function updateUiTheme(page) {
    const ui = $(".ui", page);
    if (!ui) return;
    const probe = window.innerHeight - 40;
    let theme = page.dataset.theme;
    for (const s of $$("[data-ui]", page)) {
      const r = s.getBoundingClientRect();
      if (r.top <= probe && r.bottom >= probe) {
        theme = s.dataset.ui;
        break;
      }
    }
    ui.classList.toggle("is-dark", theme === "dark");
  }

  /* ------------------------------------------------------------------------
     Gallery (drag + arrows)
     ------------------------------------------------------------------------ */

  function setupGallery(el, v) {
    const vp = $(".gallery__viewport", el);
    const track = $(".gallery__track", el);
    const items = $$(".gallery__item", el);
    const imgs = items.map((i) => $("img", i));
    let x = 0;
    let min = 0;
    const xTo = gsap.quickTo(track, "x", { duration: 1.1, ease: "expo.out" });
    const clamp = (n) => gsap.utils.clamp(min, 0, n);

    const measure = () => {
      min = Math.min(0, vp.clientWidth - track.scrollWidth);
      x = clamp(x);
      xTo(x);
    };
    measure();

    let down = false;
    let startX = 0;
    let startPos = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;

    const onDown = (e) => {
      down = true;
      startX = lastX = e.clientX;
      startPos = x;
      lastT = performance.now();
      vel = 0;
      vp.classList.add("is-dragging");
      vp.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!down) return;
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(now - lastT, 1);
      lastX = e.clientX;
      lastT = now;
      let next = startPos + (e.clientX - startX) * 1.15;
      if (next > 0) next *= 0.35;
      if (next < min) next = min + (next - min) * 0.35;
      x = next;
      xTo(x);
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      vp.classList.remove("is-dragging");
      x = clamp(x + vel * 380);
      xTo(x);
    };

    const step = (d) => {
      x = clamp(x - d * vp.clientWidth * 0.42);
      xTo(x);
    };

    vp.addEventListener("pointerdown", onDown);
    vp.addEventListener("pointermove", onMove);
    vp.addEventListener("pointerup", onUp);
    vp.addEventListener("pointercancel", onUp);
    $("[data-prev]", el).addEventListener("click", () => step(-1));
    $("[data-next]", el).addEventListener("click", () => step(1));

    // images drift inside their frames while the track moves
    const vpw = () => vp.clientWidth;
    const tick = () => {
      const tx = gsap.getProperty(track, "x");
      items.forEach((item, i) => {
        const center = item.offsetLeft + item.offsetWidth / 2 + tx - vpw() / 2;
        gsap.set(imgs[i], { xPercent: (center / vpw()) * -6 });
      });
    };
    gsap.ticker.add(tick);
    window.addEventListener("resize", measure);
    v.cleanups.push(() => {
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
    });

    gsap.from(items, {
      x: () => window.innerWidth * 0.25,
      autoAlpha: 0,
      duration: 1.6,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, scroller: v.scroller, start: "top 80%" },
    });
  }

  /* ------------------------------------------------------------------------
     Contact forms
     ------------------------------------------------------------------------ */

  function setupForms(root) {
    const tabs = $$(".tabs__btn", root);
    const bar = $(".tabs__bar", root);
    const forms = $$(".form", root);
    const success = $(".form__success", root);

    tabs.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.toggle("is-active", b === btn));
        gsap.to(bar, { xPercent: i * 100, duration: 0.8, ease: "expo.out" });
        forms.forEach((f) => f.classList.toggle("is-active", f.dataset.form === btn.dataset.tab));
        success.classList.remove("is-visible");
        const active = forms.find((f) => f.classList.contains("is-active"));
        gsap.from($$(".field, .form__foot", active), { autoAlpha: 0, y: 16, duration: 0.9, ease: "expo.out", stagger: 0.03 });
        ScrollTrigger.refresh();
      });
    });

    $$(".field", root).forEach((field) => {
      const input = $("input, select, textarea", field);
      const sync = () => {
        field.classList.toggle("is-filled", input.value.trim() !== "");
        if (input.value.trim()) field.classList.remove("is-invalid");
      };
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    });

    forms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        $$("[required]", form).forEach((input) => {
          const valid = input.value.trim() !== "" && (input.type !== "email" || /.+@.+\..+/.test(input.value));
          input.closest(".field").classList.toggle("is-invalid", !valid);
          if (!valid) ok = false;
        });
        if (!ok) return;
        gsap.to(form, {
          autoAlpha: 0,
          y: -20,
          duration: 0.6,
          ease: "expo.in",
          onComplete: () => {
            form.classList.remove("is-active");
            gsap.set(form, { clearProps: "all" });
            form.reset();
            $$(".field", form).forEach((f) => f.classList.remove("is-filled"));
            success.classList.add("is-visible");
            gsap.from(success.children, { autoAlpha: 0, y: 24, duration: 1.1, ease: "expo.out", stagger: 0.08 });
            ScrollTrigger.refresh();
          },
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Preloader
     ------------------------------------------------------------------------ */

  // resolves once the image has loaded; decode() is capped because background tabs can defer it
  function decode(img) {
    if (!img) return Promise.resolve();
    const loaded =
      img.complete && img.naturalWidth
        ? Promise.resolve()
        : new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          });
    return loaded.then(() => (img.decode ? Promise.race([img.decode().catch(() => {}), wait(350)]) : null));
  }

  function runPreloader(page, mounted) {
    const pl = $(".preloader");
    const bg = $(".preloader__bg", pl);
    const framesEl = $(".preloader__frames", pl);
    const frames = $$(".preloader__frame", pl);
    const imgs = frames.map((f) => $("img", f));
    const digits = $(".preloader__digits", pl);
    const hReel = $(".preloader__digit--h .preloader__reel", pl);
    const hBox = $(".preloader__digit--h", pl);
    const tReel = $(".preloader__digit--t .preloader__reel", pl);
    const oReel = $(".preloader__digit--o .preloader__reel", pl);

    const counter = { v: 0 };
    const setO = gsap.quickSetter(oReel, "yPercent");
    const setT = gsap.quickSetter(tReel, "yPercent");
    const setH = gsap.quickSetter(hReel, "yPercent");
    const render = () => {
      const val = counter.v;
      const ones = val % 10;
      const tens = Math.floor(val / 10) % 10 + Math.max(0, ones - 9);
      const rest = val % 100;
      const hund = Math.floor(val / 100) + Math.max(0, rest - 99);
      setO((-ones / 11) * 100);
      setT((-Math.min(tens, 10) / 11) * 100);
      setH((-Math.min(hund, 1) / 2) * 100);
      hBox.style.width = `${Math.min(hund, 1) * 0.6}em`;
    };
    render();

    let ready = false;
    const assets = Promise.all([
      mounted,
      Promise.race([Promise.all([...imgs.map(decode), decode($("[data-hero-visual] img", page))]), wait(6000)]),
    ]).then(() => (ready = true));

    gsap.set(imgs, { scale: 1.6 });

    const start = 0.3;
    const step = 0.46;
    const reveal = 1.1;
    const countEnd = start + (frames.length - 1) * step + reveal;

    const tl = gsap.timeline({ paused: true });
    tl.fromTo(digits, { yPercent: 110 }, { yPercent: 0, duration: 0.85, ease: "expo.out" }, 0.1);

    frames.forEach((f, i) => {
      const at = start + i * step;
      tl.fromTo(f, { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: reveal, ease: "expo.inOut" }, at);
      tl.to(imgs[i], { scale: 1, duration: 1.7, ease: "expo.out" }, at + 0.2);
    });

    tl.to(counter, { v: 100, duration: countEnd - 0.2, ease: "power1.inOut", onUpdate: render }, 0.2);

    // hold before the last frame until assets are decoded
    tl.add(() => {
      if (ready) return;
      tl.pause();
      assets.then(() => tl.play());
    }, start + (frames.length - 1.5) * step);

    tl.to(digits, { yPercent: -110, duration: 0.95, ease: "expo.in" }, countEnd + 0.05);

    const wipeAt = countEnd + 0.55;
    tl.add(() => html.classList.remove("is-loading"), wipeAt);
    tl.fromTo(bg, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.2, ease: "wipe", immediateRender: false }, wipeAt);

    const target = $("[data-hero-visual]", page);
    const morphAt = wipeAt + 0.45;
    tl.add(() => {
      if (!target) {
        gsap.fromTo(framesEl, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(50% 50% 50% 50%)", duration: 0.9, ease: "expo.inOut" });
        return;
      }
      const from = framesEl.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      gsap.set(framesEl, { left: from.left, top: from.top, width: from.width, height: from.height, margin: 0 });
      gsap.to(framesEl, {
        left: to.left,
        top: to.top,
        width: to.width,
        height: to.height,
        duration: 0.9,
        ease: "expo.inOut",
        onComplete: () => gsap.set(target, { autoAlpha: 1 }),
      });
    }, morphAt);

    tl.add(() => page._v.intro.play(), morphAt + 0.25);
    tl.add(() => {
      pl.remove();
      activatePage(page);
    }, morphAt + 1.0);

    if (reduced) tl.timeScale(2.5);
    tl.play();
  }

  /* ------------------------------------------------------------------------
     Selection menu
     ------------------------------------------------------------------------ */

  function slot() {
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const mobile = isMobile();
    const pad = (mobile ? 0.04 : 0.0275) * iw;
    return { scale: (iw - pad * 2) / iw, y: (mobile ? 0.78 : 0.745) * ih };
  }

  function markCurrent() {
    const key = state.page && state.page.dataset.page;
    $$(".sel-card").forEach((c) => c.classList.toggle("is-current", c.dataset.key === key));
    $$(".navmenu__links a").forEach((a) => a.classList.toggle("is-current", a.dataset.key === key));
  }

  function openSelection() {
    if (state.busy || state.selectionOpen) return;
    state.selectionOpen = true;
    const page = state.page;
    const sel = $(".selection");
    const cards = $$(".sel-card", sel);
    if (page._v.lenis) page._v.lenis.stop();
    markCurrent();

    sel.classList.add("is-open");
    sel.setAttribute("aria-hidden", "false");
    page.classList.add("is-preview");
    const { scale, y } = slot();
    gsap.to(page, { y, scale, duration: 1.15, ease: "glide" });
    gsap.fromTo(
      cards,
      { y: 70, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.06, delay: 0.3 }
    );
    gsap.fromTo($$(".sel-card__cover img", sel), { scale: 1.25 }, { scale: 1, duration: 1.6, ease: "expo.out", stagger: 0.06, delay: 0.3 });
  }

  function closeSelection() {
    if (!state.selectionOpen || state.busy) return;
    const page = state.page;
    const sel = $(".selection");
    const cards = $$(".sel-card", sel);
    state.busy = true;
    gsap.to(cards, { y: -30, autoAlpha: 0, duration: 0.6, ease: "expo.in", stagger: 0.03 });
    gsap.to(page, {
      y: 0,
      scale: 1,
      duration: 1.1,
      ease: "glide",
      delay: 0.1,
      onComplete: () => {
        resetSelection();
        page.classList.remove("is-preview");
        gsap.set(page, { clearProps: "transform" });
        if (page._v.lenis) page._v.lenis.start();
        state.busy = false;
      },
    });
  }

  function resetSelection() {
    const sel = $(".selection");
    sel.classList.remove("is-open");
    sel.setAttribute("aria-hidden", "true");
    gsap.set($$(".sel-card", sel), { clearProps: "all" });
    state.selectionOpen = false;
  }

  /* ------------------------------------------------------------------------
     Nav menu
     ------------------------------------------------------------------------ */

  function openNav() {
    if (state.busy || state.navOpen) return;
    state.navOpen = true;
    const nav = $(".navmenu");
    const page = state.page;
    if (page._v.lenis) page._v.lenis.stop();
    markCurrent();
    nav.setAttribute("aria-hidden", "false");
    gsap.set(nav, { visibility: "visible" });
    gsap.fromTo(nav, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "glide" });
    gsap.fromTo($$(".navmenu__links a span", nav), { yPercent: 110 }, { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.045, delay: 0.4 });
    gsap.fromTo([$(".navmenu__top", nav), $(".navmenu__foot", nav)], { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 0.6 });
    gsap.to(page, { y: window.innerHeight * 0.18, duration: 1.1, ease: "glide" });
  }

  function closeNav({ navigating = false } = {}) {
    if (!state.navOpen) return;
    state.navOpen = false;
    const nav = $(".navmenu");
    const page = state.page;
    nav.setAttribute("aria-hidden", "true");
    gsap.to(nav, {
      clipPath: "inset(0% 0% 100% 0%)",
      duration: navigating ? 1.0 : 1.1,
      ease: "glide",
      onComplete: () => gsap.set(nav, { visibility: "hidden" }),
    });
    if (!navigating) {
      gsap.to(page, {
        y: 0,
        duration: 1.1,
        ease: "glide",
        onComplete: () => {
          gsap.set(page, { clearProps: "transform" });
          if (page._v.lenis) page._v.lenis.start();
        },
      });
    }
  }

  /* ------------------------------------------------------------------------
     Router + transitions
     ------------------------------------------------------------------------ */

  function loadDoc(href) {
    const key = href.split("#")[0];
    if (!state.cache.has(key)) {
      state.cache.set(
        key,
        fetch(key, { credentials: "same-origin" }).then((r) => {
          if (!r.ok) throw new Error(r.status);
          return r.text();
        })
      );
    }
    return state.cache.get(key).then((text) => new DOMParser().parseFromString(text, "text/html"));
  }

  const samePage = (a, b) => {
    const norm = (u) => {
      const p = new URL(u, location.href).pathname.replace(/\/index\.html$/, "/");
      return p;
    };
    return norm(a) === norm(b);
  };

  function transitionStack(oldPage, newPage) {
    const shade = $(".page__shade", oldPage);
    gsap.set(oldPage, { zIndex: 1 });
    gsap.set(newPage, { zIndex: 2, yPercent: 100 });
    const tl = gsap.timeline();
    tl.to(oldPage, { yPercent: -24, duration: 1.3, ease: "wipe" }, 0)
      .to(shade, { opacity: 0.6, duration: 1.3, ease: "wipe" }, 0)
      .to(newPage, { yPercent: 0, duration: 1.3, ease: "wipe" }, 0)
      .fromTo(newPage, { clipPath: "inset(0% 4% 0% 4%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "expo.inOut", immediateRender: true }, 0.55)
      .add(() => newPage._v.intro.play(), 0.85);
    return tl;
  }

  function transitionFromSelection(oldPage, newPage) {
    const { scale, y } = slot();
    const cards = $$(".sel-card");
    gsap.set(oldPage, { zIndex: 1 });
    gsap.set(newPage, { zIndex: 2, scale, y: window.innerHeight });
    const tl = gsap.timeline();
    tl.to(newPage, { y, duration: 0.75, ease: "expo.out" }, 0)
      .to(newPage, { y: 0, scale: 1, duration: 1.15, ease: "wipe" }, 0.45)
      .to(cards, { y: -60, duration: 1.15, ease: "wipe" }, 0.45)
      .add(() => newPage._v.intro.play(), 1.05);
    return tl;
  }

  function transitionFromNav(oldPage, newPage) {
    gsap.set(oldPage, { zIndex: 1 });
    gsap.set(newPage, { zIndex: 2, yPercent: 100 });
    const tl = gsap.timeline();
    tl.to(newPage, { yPercent: 0, duration: 1.3, ease: "wipe" }, 0.1).add(() => newPage._v.intro.play(), 0.9);
    return tl;
  }

  async function navigate(href, { push = true } = {}) {
    if (state.busy) return;
    if (samePage(href, state.url)) {
      if (state.selectionOpen) closeSelection();
      if (state.navOpen) closeNav();
      return;
    }
    state.busy = true;

    let doc;
    try {
      doc = await loadDoc(href);
    } catch (e) {
      location.href = href;
      return;
    }

    const incoming = document.importNode($(".page", doc), true);
    const old = state.page;
    stage.appendChild(incoming);
    mountPage(incoming);
    await Promise.race([decode($("[data-hero-visual] img", incoming)), wait(1200)]);

    document.title = doc.title;
    if (push) history.pushState({}, "", href);
    state.url = new URL(href, location.href).href;

    let tl;
    if (state.selectionOpen) {
      tl = transitionFromSelection(old, incoming);
    } else if (state.navOpen) {
      closeNav({ navigating: true });
      tl = transitionFromNav(old, incoming);
    } else {
      tl = transitionStack(old, incoming);
    }
    await tl;

    unmountPage(old);
    old.remove();
    if (state.selectionOpen) resetSelection();
    gsap.set(incoming, { clearProps: "transform,clipPath,zIndex" });
    state.page = incoming;
    activatePage(incoming);
    markCurrent();
    state.busy = false;
  }

  function isInternal(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    const url = new URL(href, location.href);
    return url.origin === location.origin && /(\.html|\/)$/.test(url.pathname);
  }

  function bindGlobal() {
    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      if (e.target.closest("[data-open-selection]")) {
        e.preventDefault();
        openSelection();
        return;
      }
      if (e.target.closest("[data-open-nav]")) {
        e.preventDefault();
        openNav();
        return;
      }
      if (e.target.closest("[data-close-nav]")) {
        e.preventDefault();
        closeNav();
        return;
      }

      const a = e.target.closest("a");

      // clicking the shrunken page preview closes the selection menu
      if (state.selectionOpen && e.target.closest(".page.is-preview")) {
        e.preventDefault();
        closeSelection();
        return;
      }

      if (isInternal(a)) {
        e.preventDefault();
        navigate(a.href);
      }
    });

    // warm the cache on hover
    document.addEventListener(
      "pointerover",
      (e) => {
        const a = e.target.closest && e.target.closest("a");
        if (isInternal(a)) loadDoc(a.href).catch(() => {});
      },
      { passive: true }
    );

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (state.navOpen) closeNav();
      else if (state.selectionOpen) closeSelection();
    });

    window.addEventListener("popstate", () => navigate(location.href, { push: false }));

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (state.selectionOpen && !state.busy) gsap.set(state.page, slot());
        ScrollTrigger.refresh();
      }, 150);
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  async function boot() {
    const page = $(".page", stage);
    const heroImg = $("[data-hero-visual] img", page);
    buildShell(heroImg ? heroImg.getAttribute("src") : "assets/img/hero-home.jpg");

    history.scrollRestoration = "manual";
    state.page = page;
    state.url = location.href;

    // the preloader starts right away; only its exit waits for fonts + page setup
    const mounted = Promise.race([document.fonts.ready, wait(2500)]).then(() => {
      mountPage(page, { morph: true });
      bindGlobal();
      markCurrent();
    });
    runPreloader(page, mounted);
  }

  boot();
})();
