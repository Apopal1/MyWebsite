(() => {
  const $ = (q, el=document) => el.querySelector(q);
  const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Smooth scrolling (Lenis)
  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({ smoothWheel: true, lerp: 0.09 });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // Cursor glow
  const glow = $(".cursor-glow");
  const glowOn = () => glow && (glow.style.opacity = "1");
  const glowOff = () => glow && (glow.style.opacity = "0");
  window.addEventListener("mousemove", (e) => {
    if (!glow) return;
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  }, { passive: true });
  window.addEventListener("mouseenter", glowOn);
  window.addEventListener("mouseleave", glowOff);

  // Magnetic buttons
  const magnets = $$(".magnetic");
  magnets.forEach(btn => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
      const dy = (e.clientY - (r.top + r.height/2)) / (r.height/2);
      btn.style.transform = `translate(${dx * 6}px, ${dy * 6}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = "translate(0,0)"; });
  });

  // Card hover radial
  $$(".card").forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    }, { passive: true });
  });

  // Scroll progress
  const prog = $(".nav__progress span");
  const updateProgress = () => {
    const h = document.documentElement;
    const sc = h.scrollTop || document.body.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (sc / max) * 100 : 0;
    if (prog) prog.style.width = p.toFixed(2) + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Mini-cards jump
  $$("[data-jump]").forEach(b => {
    b.addEventListener("click", () => {
      const to = b.getAttribute("data-jump");
      scrollToHash(to);
    });
  });

  // Copy email
  function bindCopy(btnId){
    const btn = $(btnId);
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const email = btn.dataset.email || "youremail@example.com";
      try {
        await navigator.clipboard.writeText(email);
        toast(`Copied: ${email}`);
      } catch {
        toast("Copy failed (browser permissions).");
      }
    });
  }
  bindCopy("#copyEmail");
  bindCopy("#copyEmail2");

  // Back to top
  $("#toTop")?.addEventListener("click", () => scrollToHash("#top"));

  // Year
  $("#year") && ($("#year").textContent = String(new Date().getFullYear()));

  // Toast (minimal)
  let toastEl = null;
  function toast(msg){
    if (!toastEl){
      toastEl = document.createElement("div");
      toastEl.style.position = "fixed";
      toastEl.style.left = "50%";
      toastEl.style.bottom = "18px";
      toastEl.style.transform = "translateX(-50%)";
      toastEl.style.padding = "10px 12px";
      toastEl.style.borderRadius = "14px";
      toastEl.style.border = "1px solid rgba(255,255,255,0.12)";
      toastEl.style.background = "rgba(10,13,22,0.88)";
      toastEl.style.backdropFilter = "blur(12px)";
      toastEl.style.color = "rgba(255,255,255,0.9)";
      toastEl.style.fontFamily = "JetBrains Mono, monospace";
      toastEl.style.fontSize = "12px";
      toastEl.style.zIndex = "9999";
      toastEl.style.opacity = "0";
      toastEl.style.transition = "opacity .2s ease, transform .2s ease";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateX(-50%) translateY(6px)";
    }, 1400);
  }

  function scrollToHash(hash){
    const el = document.querySelector(hash);
    if (!el) return;
    if (lenis && !prefersReduced) {
      lenis.scrollTo(el, { offset: -70 });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Filters
  const chips = $$(".chip");
  const cards = $$(".projects .card");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const f = chip.dataset.filter;

      cards.forEach(card => {
        const tags = (card.dataset.tags || "").split(",").map(s => s.trim());
        const show = (f === "all") || tags.includes(f);
        card.style.display = show ? "" : "none";
      });

      if (!prefersReduced && window.gsap) {
        gsap.fromTo(cards.filter(c=>c.style.display!=="none"),
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.03, ease: "power2.out" }
        );
      }
    });
  });

  // Project modal
  const modal = $("#projectModal");
  const modalTitle = $("#modalTitle");
  const modalDesc = $("#modalDesc");
  const modalBullets = $("#modalBullets");
  const modalLinks = $("#modalLinks");

  function openProject(card){
    if (!modal) return;
    modalTitle.textContent = card.dataset.title || card.querySelector("h3")?.textContent || "Project";
    modalDesc.textContent = card.dataset.desc || "";

    const bullets = (card.dataset.bullets || "").split(";").map(s => s.trim()).filter(Boolean);
    modalBullets.innerHTML = bullets.map((b, i) => `
      <div class="bullet"><i>#${String(i+1).padStart(2,"0")}</i><div>${escapeHtml(b)}</div></div>
    `).join("");

    let links = [];
    try { links = JSON.parse(card.dataset.links || "[]"); } catch {}
    modalLinks.innerHTML = links.map(l => `
      <a class="btn btn--primary magnetic" href="${l.href}" target="_blank" rel="noreferrer">${escapeHtml(l.label)}</a>
    `).join("");

    modal.showModal();

    // rebind magnetic inside modal
    $$(".modal .magnetic").forEach(btn => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
        const dy = (e.clientY - (r.top + r.height/2)) / (r.height/2);
        btn.style.transform = `translate(${dx * 6}px, ${dy * 6}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = "translate(0,0)"; });
    });

    if (!prefersReduced && window.gsap) {
      gsap.fromTo(".modal__inner", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
    }
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }

  cards.forEach(card => card.addEventListener("click", () => openProject(card)));

  // CMDK (command palette)
  const cmdk = $("#cmdk");
  const cmdBtn = $("#cmdBtn");
  const cmdInput = $("#cmdInput");
  const cmdList = $("#cmdList");
  const cmdClose = $("#cmdClose");

  const commands = [
    { name: "Go to Projects", hint: "projects", action: () => scrollToHash("#projects") },
    { name: "Go to Stack", hint: "stack", action: () => scrollToHash("#stack") },
    { name: "Go to Path", hint: "experience", action: () => scrollToHash("#experience") },
    { name: "Go to Contact", hint: "contact", action: () => scrollToHash("#contact") },
    { name: "Back to Top", hint: "top", action: () => scrollToHash("#top") },
    { name: "Copy email", hint: "email", action: () => $("#copyEmail2")?.click() }
  ];
  let selected = 0;
  let visible = [...commands];

  function renderCmdList(){
    if (!cmdList) return;
    cmdList.innerHTML = visible.map((c, i) => `
      <button class="cmditem" type="button" role="option" aria-selected="${i===selected}">
        <span>${c.name}</span><small>${c.hint}</small>
      </button>
    `).join("");

    $$(".cmditem", cmdList).forEach((btn, i) => {
      btn.addEventListener("click", () => runCmd(i));
      btn.addEventListener("mousemove", () => { selected = i; syncSel(); });
    });
  }

  function syncSel(){
    $$(".cmditem", cmdList).forEach((el,i)=> el.setAttribute("aria-selected", String(i===selected)));
  }

  function runCmd(i){
    const cmd = visible[i];
    if (!cmd) return;
    cmd.action();
    cmdk?.close();
  }

  function openCmdk(){
    if (!cmdk) return;
    cmdk.showModal();
    cmdInput.value = "";
    visible = [...commands];
    selected = 0;
    renderCmdList();
    setTimeout(() => cmdInput.focus(), 0);
  }

  cmdBtn?.addEventListener("click", openCmdk);
  cmdClose?.addEventListener("click", () => cmdk?.close());

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === "k") {
      e.preventDefault();
      openCmdk();
    }
    if (cmdk?.open) {
      if (key === "escape") cmdk.close();
      if (key === "arrowdown") { e.preventDefault(); selected = Math.min(selected+1, visible.length-1); syncSel(); }
      if (key === "arrowup") { e.preventDefault(); selected = Math.max(selected-1, 0); syncSel(); }
      if (key === "enter") { e.preventDefault(); runCmd(selected); }
    }
  });

  cmdInput?.addEventListener("input", () => {
    const q = cmdInput.value.trim().toLowerCase();
    visible = commands.filter(c => (c.name + " " + c.hint).toLowerCase().includes(q));
    selected = 0;
    renderCmdList();
  });

  // GSAP reveals + counting
  if (!prefersReduced && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // reveal animations
    $$(".reveal").forEach(el => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 86%",
        }
      });
    });

    // Orbs drift
    gsap.to(".orb--a", { x: 60, y: 40, duration: 8, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".orb--b", { x: -50, y: -35, duration: 9, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(".orb--c", { x: 35, y: -45, duration: 10, yoyo: true, repeat: -1, ease: "sine.inOut" });

    // Count-up stats
    $$(".stat__num").forEach(el => {
      const end = Number(el.dataset.count || "0");
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: () => {
          const obj = { v: 0 };
          gsap.to(obj, {
            v: end,
            duration: 1.1,
            ease: "power2.out",
            onUpdate: () => { el.textContent = String(Math.round(obj.v)); }
          });
        }
      });
    });
  } else {
    // No motion: show reveals
    $$(".reveal").forEach(el => { el.style.opacity = "1"; el.style.transform = "none"; });
    $$(".stat__num").forEach(el => { el.textContent = el.dataset.count || "0"; });
  }

})();
