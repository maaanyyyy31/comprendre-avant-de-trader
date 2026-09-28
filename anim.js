// Joue chaque figure une fois quand elle entre à l'écran ; « Rejouer » la relance.
// Sans JavaScript, la figure reste dans son état final (data-state="4" dans le HTML).
(() => {
  const STEP = 1500;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(fig, n) {
    fig.dataset.state = n;
    fig.querySelectorAll("ol li").forEach((li, i) => li.classList.toggle("on", i + 1 === n));
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
      b.addEventListener("click", () => { clearTimeout(fig._timer); show(fig, Number(b.dataset.goto)); }));
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
    if (e.isIntersecting) { seen.unobserve(e.target); play(e.target); }
  }), { threshold: 0.45 });
  document.querySelectorAll(".figure.anim").forEach((fig) => seen.observe(fig));
})();
