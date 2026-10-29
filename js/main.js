/* ==========================================================
   Haven of Bliss — interactions
   Lenis (smooth scroll) + GSAP / ScrollTrigger (reveals)
   ========================================================== */
(() => {
  "use strict";

  /* ---------- Config (edit these) ---------- */
  const CONFIG = {
    // POST endpoint that accepts JSON { name, email, mobile, message, property_type, formtype, project }.
    // Leave empty to fall back to opening the visitor's email app addressed to salesEmail.
    formEndpoint: "https://emailjsfuntions-428145106157.asia-south1.run.app/haven-of-bliss-enquiry",
    salesEmail: "sales@vbhc.com",
    // Brochure PDF. Put the file at this path (or paste a full URL); it downloads after the brochure form is submitted.
    brochureUrl: "assets/haven-of-bliss-brochure.pdf",
    brochureName: "Haven-of-Bliss-Brochure.pdf",
    propertyPrice: 5500000, // ₹50 lakh, used by the EMI calculator
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAnimate = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!canAnimate) root.classList.add("no-anim");
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (canAnimate && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target, opts = {}) => {
    if (lenis)
      lenis.scrollTo(target, {
        offset: -10,
        duration: 1.6,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        ...opts,
      });
    else {
      const el = typeof target === "string" ? $(target) : target;
      if (el && el.scrollIntoView)
        el.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
      else if (target === 0)
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
  };
  const lockScroll = (on) => {
    if (lenis) on ? lenis.stop() : lenis.start();
    else document.body.style.overflow = on ? "hidden" : "";
  };

  /* ---------- Helpers ---------- */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            const w = document.createElement("span");
            w.className = "w";
            const i = document.createElement("span");
            i.className = "wi";
            i.textContent = part;
            w.appendChild(i);
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    $$(".w", el).forEach((w) => w.setAttribute("aria-hidden", "true"));
    return $$(".wi", el);
  }
  const fmtINR = (n) => "₹ " + Math.round(n).toLocaleString("en-IN");

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const menu = $("#menu");
  let menuOpen = false;

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    lockScroll(open);
    nav.classList.toggle("is-solid", open || window.scrollY > 40);
    if (!canAnimate) {
      menu.style.visibility = open ? "visible" : "hidden";
      menu.style.clipPath = open ? "none" : "inset(0 0 100% 0)";
      return;
    }
    gsap.killTweensOf([menu, ".menu__links li", ".menu__foot > *"]);
    if (open) {
      gsap.set(menu, { visibility: "visible" });
      gsap.fromTo(
        menu,
        { clipPath: "inset(0 0 100% 0)" },
        { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "power4.inOut" },
      );
      gsap.fromTo(
        ".menu__links li",
        { yPercent: 40, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.06,
          delay: 0.3,
        },
      );
      gsap.fromTo(
        ".menu__foot > *",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.06,
          delay: 0.55,
        },
      );
    } else {
      gsap.to(menu, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.7,
        ease: "power4.inOut",
        onComplete: () => gsap.set(menu, { visibility: "hidden" }),
      });
    }
  }
  burger.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (menuOpen && window.innerWidth > 980) setMenu(false);
  });

  $$("[data-scroll]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;
      e.preventDefault();
      const wasOpen = menuOpen;
      if (wasOpen) setMenu(false);
      const go = () =>
        href === "#top"
          ? scrollToTarget(0)
          : scrollToTarget(href, { offset: -(nav.offsetHeight - 6) });
      wasOpen ? setTimeout(go, 150) : go();
    }),
  );

  // Solid header + hide-on-scroll-down
  let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-solid", y > 40 || menuOpen);
    nav.classList.remove("is-hidden"); // header always stays visible
    lastY = y;
    $("#toTop").classList.toggle("is-on", y > 700);
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else
    window.addEventListener("scroll", () => onScroll(window.scrollY), {
      passive: true,
    });
  onScroll(window.scrollY);
  $("#toTop").addEventListener("click", () => scrollToTarget(0));

  // Scroll progress bar
  const bar = $("#progress i");
  const updateProgress = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform =
      "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ")";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ---------- Tabs (generic, accessible) ---------- */
  function initTabs(tablist, onChange) {
    const tabs = $$('[role="tab"]', tablist);
    const panelOf = (t) =>
      document.getElementById(t.getAttribute("aria-controls"));
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const p = panelOf(t);
        if (!on) p.hidden = true;
      });
      const p = panelOf(tab);
      p.hidden = false;
      if (focus) tab.focus();
      if (canAnimate) {
        const kids =
          p.children.length > 1 && p.matches("ul") ? $$("li", p) : [p];
        gsap.fromTo(
          kids,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: p.matches("ul") ? 0.04 : 0,
            overwrite: "auto",
            onComplete: () => ScrollTrigger.refresh(),
          },
        );
      }
      if (onChange) onChange(tab, p);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        let n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft")
          n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") n = tabs[0];
        if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) {
          e.preventDefault();
          select(n, true);
        }
      });
    });
  }
  $$('.tabs[role="tablist"]').forEach((tl) => initTabs(tl));

  /* ---------- FAQ accordion ---------- */
  const faqItems = $$(".faq__item");
  function toggleFaq(item, open) {
    const q = $(".faq__q", item),
      a = $(".faq__a", item);
    item.classList.toggle("is-open", open);
    q.setAttribute("aria-expanded", String(open));
    if (canAnimate) {
      gsap.to(a, {
        height: open ? "auto" : 0,
        duration: 0.7,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else a.style.height = open ? "auto" : "0";
  }
  faqItems.forEach((item) => {
    const a = $(".faq__a", item);
    a.style.height = item.classList.contains("is-open") ? "auto" : "0";
    $(".faq__q", item).addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      faqItems.forEach((o) => {
        if (o !== item && o.classList.contains("is-open")) toggleFaq(o, false);
      });
      toggleFaq(item, willOpen);
    });
  });

  /* ---------- Dialogs: enquiry + lightbox ---------- */
  const enquiry = $("#enquiry");
  const lightbox = $("#lightbox");
  let lastTrigger = null;

  function openDialog(d, box) {
    lastTrigger = document.activeElement;
    if (menuOpen) setMenu(false);
    d.showModal();
    lockScroll(true);
    if (canAnimate) {
      gsap.fromTo(
        box,
        { y: 50, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: "power4.out" },
      );
      gsap.fromTo(d, { "--bd": 0 }, { "--bd": 1, duration: 0.4 });
    }
  }
  function closeDialog(d, box) {
    if (!d.open) return;
    const done = () => {
      d.close();
    };
    if (canAnimate)
      gsap.to(box, {
        y: 30,
        opacity: 0,
        scale: 0.98,
        duration: 0.35,
        ease: "power2.in",
        onComplete: done,
      });
    else done();
  }
  [
    [enquiry, ".modal__box"],
    [lightbox, "#lbImg"],
  ].forEach(([d, sel]) => {
    const box = () => $(sel, d);
    d.addEventListener("cancel", (e) => {
      e.preventDefault();
      closeDialog(d, box());
    });
    d.addEventListener("close", () => {
      lockScroll(false);
      if (lastTrigger && lastTrigger.focus)
        lastTrigger.focus({ preventScroll: true });
    });
    d.addEventListener("click", (e) => {
      if (e.target === d || (d === enquiry && e.target === $(".modal[open]")))
        closeDialog(d, box());
    });
    $$("[data-close]", d).forEach((b) =>
      b.addEventListener("click", () => closeDialog(d, box())),
    );
  });

  // Enquiry / brochure modes
  const form = $("#enqForm");
  const ok = $("#enqOk");
  function openEnquiry(mode) {
    const brochure = mode === "brochure";
    $("#formtype").value = brochure ? "DownloadBrochure" : "EnquiryForm";
    $("#enqSubmit span").textContent = brochure
      ? "Download Brochure"
      : "Send Message";
    $("#f-type-l").textContent = brochure
      ? "Property Type:"
      : "I am interested in:";
    form.hidden = false;
    ok.hidden = true;
    openDialog(enquiry, $(".modal__box", enquiry));
  }
  $$("[data-open-enquiry]").forEach((b) =>
    b.addEventListener("click", () => openEnquiry("enquiry")),
  );
  $$("[data-open-brochure]").forEach((b) =>
    b.addEventListener("click", () => openEnquiry("brochure")),
  );

  // Lightbox
  $$("[data-lightbox]").forEach((b) =>
    b.addEventListener("click", () => {
      const img = $("#lbImg");
      img.src = b.dataset.lightbox;
      img.alt = b.dataset.alt || "";
      openDialog(lightbox, img);
    }),
  );

  // Validation + submit (works for the popup and the contact section)
  const rules = {
    name: (v) => v.trim().length >= 2 || "Please enter your name",
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ||
      "Please enter a valid email address",
    mobile: (v) =>
      /^[6-9]\d{9}$/.test(v.replace(/^\+?91|[\s-]/g, "")) ||
      "Please enter a valid 10-digit mobile number",
  };
  const validateField = (input) => {
    const rule = rules[input.name];
    if (!rule) return true;
    const res = rule(input.value);
    const wrap = input.closest(".fld");
    wrap.classList.toggle("has-err", res !== true);
    $(".err", wrap).textContent = res === true ? "" : res;
    return res === true;
  };
  const downloadBrochure = () => {
    if (!CONFIG.brochureUrl) return;
    const a = document.createElement("a");
    a.href = CONFIG.brochureUrl;
    a.download = CONFIG.brochureName || "";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  $$(".js-form").forEach((f) => {
    const okBox = f.parentElement.querySelector(".js-ok");
    const okMsg = $(".js-ok-msg", okBox) || $("#enqOkMsg");
    const submit = $(".js-submit", f);
    $$(".fld input", f).forEach((i) => {
      i.addEventListener("blur", () => validateField(i));
      i.addEventListener("input", () => {
        if (i.closest(".fld").classList.contains("has-err")) validateField(i);
      });
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputs = $$(".fld input", f).filter((i) => rules[i.name]);
      const valid = inputs.map(validateField).every(Boolean);
      if (!valid) {
        const bad = inputs.find((i) =>
          i.closest(".fld").classList.contains("has-err"),
        );
        if (bad) bad.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(f).entries());
      const brochure = data.formtype === "DownloadBrochure";
      submit.disabled = true;
      let msg = brochure
        ? "Thank you! Your brochure is downloading. Our team will also be in touch shortly."
        : "We have received your details and our team will be in touch shortly.";
      try {
        if (CONFIG.formEndpoint) {
          const r = await fetch(CONFIG.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!r.ok) throw new Error("Request failed");
        }
        // Brochure downloads only after the form has been submitted successfully
        if (brochure) downloadBrochure();
        if (!CONFIG.formEndpoint) {
          const body = [
            "Name: " + data.name,
            "Email: " + data.email,
            "Mobile: " + data.mobile,
            "Interested in: " + (data.property_type || "1 BHK"),
            "",
            data.message || "",
          ].join("\n");
          setTimeout(
            () => {
              window.location.href =
                "mailto:" +
                CONFIG.salesEmail +
                "?subject=" +
                encodeURIComponent(
                  (brochure ? "Brochure request" : "Enquiry") +
                    " — Haven of Bliss",
                ) +
                "&body=" +
                encodeURIComponent(body);
            },
            brochure ? 400 : 0,
          );
          if (!brochure)
            msg =
              "Your email app has opened with your details. Press send there and our team will get back to you shortly.";
        }
        okMsg.textContent = msg;
        f.hidden = true;
        okBox.hidden = false;
        f.reset();
        if (canAnimate)
          gsap.fromTo(
            okBox.children,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "power3.out",
            },
          );
        if (f.id === "contactForm")
          setTimeout(() => {
            f.hidden = false;
            okBox.hidden = true;
          }, 9000);
      } catch (err) {
        $(".err", $$(".fld", f)[$$(".fld", f).length - 2] || f).textContent =
          "Something went wrong. Please try again or call +91 7353 720 720.";
      } finally {
        submit.disabled = false;
      }
    });
  });

  /* ---------- EMI calculator ---------- */
  (function emi() {
    const dp = $("#downPayment"),
      du = $("#duration"),
      ir = $("#interest");
    const C = 2 * Math.PI * 50;
    const prin = $("#donutPrin"),
      intr = $("#donutInt");
    const set = (id, v) => {
      $(id).textContent = v;
    };
    const fill = (el) =>
      el.style.setProperty(
        "--fill",
        ((el.value - el.min) / (el.max - el.min)) * 100 + "%",
      );
    function calc() {
      const down = +dp.value,
        years = +du.value,
        rate = +ir.value;
      const advance = (CONFIG.propertyPrice * down) / 100;
      const loan = CONFIG.propertyPrice - advance;
      const r = rate / 12 / 100,
        n = years * 12;
      const emi = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const total = emi * n,
        interest = total - loan;
      set("#loanAmountText", fmtINR(loan));
      set("#downPaymentText", fmtINR(advance));
      set("#durationText", years + (years === 1 ? " Year" : " Years"));
      set("#interestText", rate + "%");
      set("#emiResult", fmtINR(emi));
      set("#emiResult2", fmtINR(emi));
      set("#downBubble", down + "%");
      set("#durationBubble", years + (years === 1 ? " Year" : " Years"));
      set("#interestBubble", rate + "%");
      set("#interestTotal", "(" + fmtINR(interest) + ")");
      const share = loan / total;
      prin.style.strokeDasharray = C * share + " " + C;
      prin.style.strokeDashoffset = 0;
      intr.style.strokeDasharray = C * (1 - share) + " " + C;
      intr.style.strokeDashoffset = -(C * share);
      [dp, du, ir].forEach(fill);
    }
    [dp, du, ir].forEach((el) => el.addEventListener("input", calc));
    calc();
  })();

  /* ---------- Magnetic buttons ---------- */
  if (canAnimate && fine) {
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------- Animations ---------- */
  function initScrollAnimations() {
    // Split headings (not hero — handled in intro)
    $$("[data-split]").forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 115 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(words, {
            yPercent: 0,
            duration: 1.15,
            ease: "power4.out",
            stagger: 0.05,
          }),
      });
    });

    // Fade-up reveals
    $$("[data-reveal]").forEach((el) => {
      gsap.set(el, { y: 36 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            delay: parseFloat(el.dataset.delay || 0),
          }),
      });
    });

    // Staggered groups
    $$("[data-stagger]").forEach((group) => {
      const kids = Array.from(group.children);
      gsap.set(kids, { y: 40 });
      ScrollTrigger.create({
        trigger: group,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(kids, {
            y: 0,
            opacity: 1,
            duration: 0.95,
            ease: "power3.out",
            stagger: 0.09,
          }),
      });
    });

    // Amenity tiles: grid-aware stagger
    const amenItems = $$("#amenList .amen__item");
    if (amenItems.length) {
      gsap.set(amenItems, { y: 50, opacity: 0 });
      ScrollTrigger.batch(amenItems, {
        start: "top 92%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.07,
            overwrite: true,
          }),
      });
    }

    // Image mask reveals + parallax
    $$("[data-clip]").forEach((el) => {
      const img = $("img", el);
      gsap.set(el, { clipPath: "inset(100% 0 0 0)" });
      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        })
        .to(el, {
          clipPath: "inset(0% 0 0 0)",
          duration: 1.4,
          ease: "power4.inOut",
        })
        .fromTo(
          img,
          { scale: 1.3 },
          { scale: 1, duration: 1.8, ease: "power3.out" },
          0,
        );
    });
    $$("[data-parallax]").forEach((img) => {
      const amt = parseFloat(img.dataset.parallax) || 8;
      gsap.fromTo(
        img,
        { yPercent: -amt * 0.6 },
        {
          yPercent: amt * 0.6,
          ease: "none",
          scrollTrigger: {
            trigger: img.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    // Section backgrounds
    const towerBg = $("[data-tower-bg] img");
    if (towerBg)
      gsap.fromTo(
        towerBg,
        { yPercent: -9, scale: 1.08 },
        {
          yPercent: 9,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".tower",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    gsap.to(".hero__media", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
    gsap.to(".hero__inner", {
      yPercent: -10,
      opacity: 0.15,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "30% top",
        end: "bottom top",
        scrub: true,
      },
    });

    // Counters
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count),
        suffix = el.dataset.suffix || "";
      const o = { v: 0 };
      el.textContent = "0" + suffix;
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () =>
          gsap.to(o, {
            v: end,
            duration: end > 1000 ? 2.4 : 1.8,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.round(o.v) + suffix;
            },
          }),
      });
    });

    // Plans/panels etc. get recalculated after fonts and images settle
    window.addEventListener("load", () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ---------- Intro ---------- */
  function intro() {
    const loader = $("#loader");
    const heroTitle = $("[data-split-hero]");
    const words = splitWords(heroTitle);
    gsap.set(words, { yPercent: 118 });
    gsap.set(".hero__media img", { scale: 1.25 });
    gsap.set(".hero__media", { clipPath: "inset(8% 6% 8% 6% round 28px)" });
    gsap.set("[data-hero]", { y: 28 });
    gsap.set(nav, { yPercent: -100 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(".loader__bar i", { scaleX: 1, duration: 1.1, ease: "power2.inOut" })
      .from(
        ".loader__mark span,.loader__mark em",
        { yPercent: 40, opacity: 0, duration: 0.8, stagger: 0.1 },
        0,
      )
      .to(
        loader,
        { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "power4.inOut" },
        "+=.1",
      )
      .to(
        ".hero__media",
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          duration: 1.5,
          ease: "power4.inOut",
        },
        "<.1",
      )
      .to(
        ".hero__media img",
        { scale: 1, duration: 2, ease: "power3.out" },
        "<",
      )
      .to(
        words,
        { yPercent: 0, duration: 1.3, ease: "power4.out", stagger: 0.09 },
        "<.5",
      )
      .to(
        "[data-hero]",
        { y: 0, opacity: 1, duration: 1, stagger: 0.12 },
        "<.3",
      )
      .to(nav, { yPercent: 0, duration: 1, ease: "power3.out" }, "<.2")
      .add(() => {
        loader.style.display = "none";
        ScrollTrigger.refresh();
      }, ">");
    gsap.set(loader, { clipPath: "inset(0 0 0% 0)" });
    return tl;
  }

  if (canAnimate) {
    window.scrollTo(0, 0);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    initScrollAnimations();
    intro();
    // Safety net: never leave content hidden if something fails
    setTimeout(() => {
      if (getComputedStyle($("[data-hero]")).opacity === "0")
        root.classList.add("no-anim");
    }, 7000);
  } else {
    const l = $("#loader");
    if (l) l.style.display = "none";
    $$("[data-count]").forEach((el) => {
      /* keep static text */
    });
  }
})();
