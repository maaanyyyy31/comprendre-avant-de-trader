// Joue chaque figure une fois quand elle entre à l'écran ; « Rejouer » la relance.
// Sans JavaScript, la figure reste dans son état final (data-state="4" dans le HTML).
(() => {
  const STEP = 1500;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(fig, n) {
    fig.dataset.state = n;
    fig.querySelectorAll('[data-goto]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.goto) === n)));
    if (fig.id === 'figure-14') {
      const image = fig.querySelector(`[data-image="${n < 3 ? Math.max(1, n) : 3}"]`);
      fig.querySelector('a.zoom').href = image.src;
    }
    if (fig.id === 'figure-15' && !fig._played) {
      const count = [0, 1, 10, 100, 300][n];
      const demo = [0];
      for (let i = 1; i <= count; i++) demo.push(i * 18 + Math.sin(i * 1.7) * 85);
      plot(fig, demo);
    }
    fig.querySelectorAll("ol li").forEach((li, i) => li.classList.toggle("on", i + 1 === n));
  }

  function plot(fig, balances) {
    const count = balances.length - 1;
    const lo = balances.reduce((a, b) => Math.min(a, b), 0), hi = balances.reduce((a, b) => Math.max(a, b), Math.max(100, count * 18));
    const y = value => 200 - (value - lo) / (hi - lo) * 170;
    fig.querySelector('[data-curve]').setAttribute('points', balances.map((value, i) => `${40 + i / Math.max(1, count) * 570},${y(value)}`).join(' '));
    const reference = fig.querySelector('[data-expectation]');
    reference.setAttribute('y1', y(0));
    reference.setAttribute('y2', y(count * 18));
  }

  function play(fig, from = 1) {
    clearTimeout(fig._timer);
    const pause = Number(fig.querySelector("[data-pause]")?.dataset.pause || 0);
    const verdict = fig.querySelector(".verdict");
    if (from === 1 && verdict) verdict.textContent = "";
    if (calm) return show(fig, 4);
    show(fig, 0);
    let n = from;
    const tick = () => {
      show(fig, n);
      if (n === pause) return; // le lecteur choisit avant la suite
      if (n++ < 4) fig._timer = setTimeout(tick, STEP);
    };
    fig._timer = setTimeout(tick, 60);
  }

  document.querySelectorAll(".figure.anim").forEach((fig) => {
    if (fig.id === 'figure-14') fig.querySelector('small').textContent = 'Captures réelles · CL M5, 28 septembre 2026, heure de Paris';
    if (fig.id === 'figure-15') {
      fig.querySelector('small').textContent = 'Simulation aléatoire · jeu fictif';
      let balances = [0];
      const update = () => {
        const count = balances.length - 1, balance = balances[count];
        fig.querySelector('[data-count]').textContent = count.toLocaleString('fr-FR');
        fig.querySelector('[data-balance]').textContent = `${balance.toLocaleString('fr-FR')} $`;
        fig.querySelector('[data-average]').textContent = count ? `${(balance / count).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} $` : '—';
        plot(fig, balances);
      };
      fig.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () => {
        clearTimeout(fig._timer);
        fig._interacted = true; fig._played = true;
        for (let i = 0; i < Number(b.dataset.play); i++) balances.push(balances[balances.length - 1] + (Math.random() < .4 ? 120 : -50));
        fig.querySelector('.demo-label').textContent = 'Tes tirages · gain +120 $ ou perte −50 $ à chaque partie.';
        show(fig, balances.length > 100 ? 4 : balances.length > 10 ? 3 : balances.length > 2 ? 2 : 1);
        update();
      }));
      fig.querySelector('[data-reset]').addEventListener('click', () => {
        clearTimeout(fig._timer); fig._interacted = true; fig._played = true; balances = [0]; show(fig, 1); update();
        fig.querySelector('.demo-label').textContent = 'À toi de jouer.';
      });
    }
    show(fig, 0);
    fig.querySelector(".rejouer").addEventListener("click", () => play(fig));
    fig.querySelectorAll("[data-answer]").forEach((b) =>
      b.addEventListener("click", () => {
        fig.querySelector(".verdict").textContent = b.dataset.answer === "A"
          ? "Oui : en A, beaucoup de volume exécuté et le prix n'avance plus."
          : "Regarde le volume : en B il s'assèche, c'est l'effort qui manque, pas une absorption.";
        play(fig, 3);
      }));
    fig.querySelectorAll("[data-goto]").forEach((b) =>
      b.addEventListener("click", () => { fig._interacted = true; clearTimeout(fig._timer); show(fig, Number(b.dataset.goto)); }));
  });

  // Captures : agrandies dans la page ; on sort par la croix, Échap, ou un clic n'importe où.
  const box = document.createElement("div");
  box.className = "visionneuse";
  box.hidden = true;
  box.innerHTML = '<button type="button" class="fermer" aria-label="Fermer">✕ Fermer</button><img alt="">';
  document.body.append(box);
  const close = () => { box.hidden = true; document.body.classList.remove("fige"); };
  box.addEventListener("click", close);
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  document.querySelectorAll("a.zoom").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const img = box.querySelector("img");
      img.src = a.href;
      img.alt = a.querySelector("img")?.alt || "";
      box.hidden = false;
      document.body.classList.add("fige");
      box.querySelector(".fermer").focus();
    }));

  const seen = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { seen.unobserve(e.target); if (!e.target._interacted) play(e.target); }
  }), { threshold: 0.45 });
  document.querySelectorAll(".figure.anim").forEach((fig) => seen.observe(fig));
})();
