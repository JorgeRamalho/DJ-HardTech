(() => {
  const KEY = "hardtech.consent.v1";
  const DRAFT = "hardtech.booking.draft";

  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    const setNavOpen = (open) => {
      nav.classList.toggle("open", open);
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };
    navToggle.addEventListener("click", () => setNavOpen(!nav.classList.contains("open")));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        setNavOpen(false);
        navToggle.focus();
      }
    });
  }

  const supportsView = CSS.supports("animation-timeline: view()");
  if (!supportsView && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.animation = "reveal .7s ease both";
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    nodes.forEach((node) => observer.observe(node));
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const filters = document.querySelector("[data-filters]");
  if (filters) {
    const cards = [...document.querySelectorAll("[data-kind]")];
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      const kind = button.dataset.filter;
      cards.forEach((card) => {
        card.classList.toggle("hidden", kind !== "todos" && card.dataset.kind !== kind);
      });
    });
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      const text = target ? target.innerText.trim() : button.dataset.text || "";
      try {
        await navigator.clipboard.writeText(text);
        const original = button.textContent;
        button.textContent = "Copiado";
        setTimeout(() => { button.textContent = original; }, 1400);
      } catch {
        button.textContent = "Selecione e copie";
      }
    });
  });

  function mountHeroCanvas(canvas) {
    const context = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = true;
    let raf = 0;

    const size = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      return { width, height };
    };

    const paint = (time) => {
      if (!running) return;
      const { width, height } = size();
      const t = reduce ? 0 : time / 1000;
      const vx = width * 0.5;
      const vy = height * 0.38;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#07080b";
      context.fillRect(0, 0, width, height);

      const glow = context.createRadialGradient(vx, vy + height * 0.18, 0, vx, height * 0.72, height * 0.62);
      glow.addColorStop(0, "rgba(228,255,74,0.9)");
      glow.addColorStop(0.18, "rgba(228,255,74,0.28)");
      glow.addColorStop(0.55, "rgba(227,154,88,0.08)");
      glow.addColorStop(1, "rgba(228,255,74,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      const drawTower = (side) => {
        for (let i = 0; i < 5; i += 1) {
          const z = 0.12 + i * 0.16;
          const breathe = Math.sin(t * 1.7 + i * 0.8) * height * 0.012 * z;
          const inner = vx + side * width * (0.045 + z * 0.05);
          const outer = vx + side * width * (0.14 + z * 0.4);
          const top = vy - height * 0.2 + z * height * 0.05 + breathe;
          const bottom = vy + z * height * 0.5;
          context.beginPath();
          context.moveTo(vx + side * width * 0.03, vy - height * 0.02);
          context.lineTo(outer, top);
          context.lineTo(outer, bottom);
          context.lineTo(inner, vy + z * height * 0.34);
          context.closePath();
          context.fillStyle = "rgba(12,10,8,0.72)";
          context.fill();
          context.strokeStyle = i % 2 === 0 ? "rgba(227,154,88,0.9)" : "rgba(228,255,74,0.75)";
          context.lineWidth = Math.max(1, z * 4);
          context.stroke();
        }
      };
      drawTower(-1);
      drawTower(1);

      context.beginPath();
      const beam = 10 + Math.sin(t * 2.2) * 6;
      context.moveTo(vx - 2, vy);
      context.lineTo(vx - beam * 4, height);
      context.lineTo(vx + beam * 4, height);
      context.closePath();
      const beamFill = context.createLinearGradient(vx, vy, vx, height);
      beamFill.addColorStop(0, "rgba(228,255,74,0.05)");
      beamFill.addColorStop(0.45, "rgba(228,255,74,0.55)");
      beamFill.addColorStop(1, "rgba(228,255,74,0.05)");
      context.fillStyle = beamFill;
      context.fill();

      for (let i = 0; i < 16; i += 1) {
        const z = (i + 1) / 16;
        const y = vy + Math.pow(z, 1.65) * height * 0.58;
        const spread = 0.06 + z * 0.94;
        context.beginPath();
        const steps = 72;
        for (let s = 0; s <= steps; s += 1) {
          const p = s / steps;
          const x = vx + (p - 0.5) * width * spread;
          const wave = Math.sin(p * Math.PI * 7 + t * 2.6 - z * 8) * (4 + z * 26);
          const yy = y + wave * z;
          if (s === 0) context.moveTo(x, yy);
          else context.lineTo(x, yy);
        }
        context.strokeStyle = i % 3 === 0 ? "rgba(228,255,74,0.9)" : "rgba(227,154,88,0.62)";
        context.lineWidth = 1 + z * 2.4;
        context.stroke();
      }

      const chevronY = height * 0.9;
      context.beginPath();
      context.moveTo(vx - width * 0.16, chevronY);
      context.lineTo(vx, chevronY - height * 0.07 - Math.sin(t * 2) * 6);
      context.lineTo(vx + width * 0.16, chevronY);
      context.strokeStyle = "#e4ff4a";
      context.lineWidth = 2;
      context.stroke();

    };

    const loop = (time) => {
      paint(time);
      if (running && !reduce) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const start = () => {
      if (raf || reduce && canvas.width) return;
      raf = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver((entries) => {
      running = entries.some((entry) => entry.isIntersecting);
      if (running) start();
    });
    observer.observe(canvas);
    start();
  }

  const heroCanvas = document.querySelector("[data-hero-canvas]");
  if (heroCanvas) mountHeroCanvas(heroCanvas);

  const canvas = document.querySelector("[data-wave]");
  if (canvas && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const context = canvas.getContext("2d");
    const paint = (time) => {
      const width = canvas.width = canvas.clientWidth * devicePixelRatio;
      const height = canvas.height = canvas.clientHeight * devicePixelRatio;
      context.clearRect(0, 0, width, height);
      context.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const progress = x / width;
        const wave = Math.sin(progress * 18 + time / 380) * 0.35
          + Math.sin(progress * 42 + time / 190) * 0.2;
        const y = height / 2 + wave * height * 0.28;
        context.lineTo(x, y);
      }
      context.strokeStyle = "#e4ff4a";
      context.lineWidth = 2 * devicePixelRatio;
      context.stroke();
      requestAnimationFrame(paint);
    };
    requestAnimationFrame(paint);
  }

  function readConsent() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null");
    } catch {
      return null;
    }
  }

  function writeConsent(value) {
    const stored = { ...value, essential: true, updatedAt: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(stored));
    document.documentElement.dataset.consent = stored.analytics || stored.marketing || stored.functional ? "custom" : "essential";
    return stored;
  }

  function formState(form) {
    return {
      essential: true,
      functional: form.querySelector("[name='functional']").checked,
      analytics: form.querySelector("[name='analytics']").checked,
      marketing: form.querySelector("[name='marketing']").checked
    };
  }

  function fillForm(form, consent) {
    if (!form || !consent) return;
    form.querySelector("[name='functional']").checked = Boolean(consent.functional);
    form.querySelector("[name='analytics']").checked = Boolean(consent.analytics);
    form.querySelector("[name='marketing']").checked = Boolean(consent.marketing);
  }

  const pageForm = document.querySelector("[data-consent-form]");
  let dialog = document.querySelector("[data-consent-dialog]");

  if (!dialog) {
    dialog = document.createElement("div");
    dialog.className = "dialog";
    dialog.dataset.consentDialog = "";
    dialog.innerHTML = `
      <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <p class="eyebrow">Privacidade</p>
        <h2 id="consent-title">Permissões deste navegador</h2>
        <p class="lede">O site funciona com o essencial. Analítico e marketing ficam desligados até você autorizar. Nada aqui é vendido.</p>
        <form data-consent-form>
          <div class="switch"><div><strong>Essenciais</strong><p>Guardam somente esta escolha. Sempre ativos.</p></div><input type="checkbox" checked disabled name="essential"></div>
          <div class="switch"><div><strong>Funcionais</strong><p>Lembram o rascunho do pedido de booking neste aparelho.</p></div><input type="checkbox" name="functional"></div>
          <div class="switch"><div><strong>Analíticos</strong><p>Reservados para uma medição futura de audiência. Nenhum script de terceiros está instalado.</p></div><input type="checkbox" name="analytics"></div>
          <div class="switch"><div><strong>Marketing</strong><p>Reservados para campanha e remarketing. Nenhum pixel está instalado.</p></div><input type="checkbox" name="marketing"></div>
          <div class="actions">
            <button class="btn" type="submit">Salvar preferências</button>
            <button class="btn ghost" type="button" data-reject>Só o essencial</button>
            <a class="btn ghost" href="privacidade.html">Ler a política</a>
          </div>
          <p class="success" data-consent-status role="status"></p>
        </form>
      </div>`;
    document.body.appendChild(dialog);
  }

  const forms = [...document.querySelectorAll("[data-consent-form]")];
  const banner = document.createElement("aside");
  banner.className = "banner";
  banner.innerHTML = `
    <div>
      <p class="eyebrow">Cookies e privacidade</p>
      <p>Usamos armazenamento local para lembrar sua escolha. Medição e marketing só entram com permissão. Leia a política antes de decidir.</p>
    </div>
    <div class="actions">
      <button class="btn" type="button" data-accept>Aceitar tudo</button>
      <button class="btn ghost" type="button" data-reject>Rejeitar opcionais</button>
      <button class="btn ghost" type="button" data-open-consent>Personalizar</button>
    </div>`;
  document.body.appendChild(banner);

  function openDialog() {
    const consent = readConsent();
    forms.forEach((form) => fillForm(form, consent));
    dialog.classList.add("show");
    dialog.querySelector("button, a")?.focus();
  }
  function closeDialog() { dialog.classList.remove("show"); }

  banner.querySelector("[data-accept]").addEventListener("click", () => {
    writeConsent({ functional: true, analytics: true, marketing: true });
    banner.classList.remove("show");
  });
  banner.querySelector("[data-reject]").addEventListener("click", () => {
    writeConsent({ functional: false, analytics: false, marketing: false });
    localStorage.removeItem(DRAFT);
    banner.classList.remove("show");
  });
  banner.querySelector("[data-open-consent]").addEventListener("click", () => {
    if (pageForm) {
      pageForm.scrollIntoView({ behavior: "smooth", block: "start" });
      banner.classList.remove("show");
      return;
    }
    openDialog();
  });

  forms.forEach((form) => {
    fillForm(form, readConsent());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const saved = writeConsent(formState(form));
      if (!saved.functional) localStorage.removeItem(DRAFT);
      const status = form.querySelector("[data-consent-status]");
      if (status) {
        status.classList.add("show");
        status.textContent = "Preferências salvas neste navegador.";
      }
      banner.classList.remove("show");
      closeDialog();
    });
    form.querySelector("[data-reject]")?.addEventListener("click", () => {
      form.querySelector("[name='functional']").checked = false;
      form.querySelector("[name='analytics']").checked = false;
      form.querySelector("[name='marketing']").checked = false;
      form.requestSubmit();
    });
  });

  document.querySelectorAll("[data-open-consent]").forEach((button) => {
    if (button.closest(".banner")) return;
    button.addEventListener("click", openDialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDialog();
  });

  if (!readConsent()) banner.classList.add("show");

  document.querySelector("[data-erase]")?.addEventListener("click", () => {
    localStorage.removeItem(KEY);
    localStorage.removeItem(DRAFT);
    forms.forEach((form) => fillForm(form, { functional: false, analytics: false, marketing: false }));
    const status = document.querySelector("[data-erase-status]");
    if (status) {
      status.classList.add("show");
      status.textContent = "Os dados locais deste site foram apagados. A faixa de cookies volta na próxima página.";
    }
    banner.classList.add("show");
  });

  const booking = document.querySelector("[data-booking]");
  if (booking) {
    const consent = readConsent();
    if (consent?.functional) {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT) || "null");
        if (draft) {
          Object.entries(draft).forEach(([name, value]) => {
            const field = booking.elements[name];
            if (field && field.type !== "checkbox") field.value = value;
          });
        }
      } catch { /* ignore broken draft */ }
    }
    booking.addEventListener("input", () => {
      const current = readConsent();
      if (!current?.functional) return;
      const data = Object.fromEntries(new FormData(booking).entries());
      delete data.consent;
      localStorage.setItem(DRAFT, JSON.stringify(data));
    });
    booking.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(booking).entries());
      const missing = [];
      if (!data.nome || data.nome.trim().length < 2) missing.push("nome");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || "")) missing.push("e-mail válido");
      if (!data.data) missing.push("data");
      if (!data.cidade || data.cidade.trim().length < 2) missing.push("cidade");
      if (!data.mensagem || data.mensagem.trim().length < 12) missing.push("mensagem");
      if (!data.consent) missing.push("aceite da política");
      const error = booking.querySelector("[data-form-error]");
      const success = booking.querySelector("[data-form-success]");
      if (missing.length) {
        error.textContent = `Revise: ${missing.join(", ")}.`;
        success.classList.remove("show");
        return;
      }
      error.textContent = "";
      const brief = [
        "Pedido de booking — DJ HardTech",
        `Nome: ${data.nome}`,
        `E-mail: ${data.email}`,
        `Data: ${data.data}`,
        `Cidade: ${data.cidade}`,
        `Casa / festa: ${data.casa || "a definir"}`,
        `Mensagem: ${data.mensagem}`
      ].join("\n");
      success.classList.add("show");
      success.querySelector("[data-brief]").textContent = brief;
      if (readConsent()?.functional) localStorage.removeItem(DRAFT);
    });
  }
})();
