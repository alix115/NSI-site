// ============================================================
//  NFS HEAT — Landing page : logique d'affichage du garage
// ============================================================

const CATEGORIES = {
  "Hypercar":    { label: "Hypercar",      color: "#ffd60a", body: "sport" },
  "Supercar":    { label: "Supercar",      color: "#ff3b5c", body: "sport" },
  "Sportscar":   { label: "Sportive",      color: "#00bfff", body: "sport" },
  "Trackday":    { label: "Piste",         color: "#00e5ff", body: "sport" },
  "Performance": { label: "Performance",   color: "#af52de", body: "sport" },
  "Muscle":      { label: "Muscle",        color: "#ff6a00", body: "muscle" },
  "Open-top":    { label: "Cabriolet",     color: "#ff5ad0", body: "open" },
  "Coupe":       { label: "Coupé",         color: "#00e5c4", body: "sport" },
  "Rally":       { label: "Rallye",        color: "#5ac8fa", body: "sport" },
  "Hot Hatch":   { label: "Hot Hatch",     color: "#a6e22e", body: "hatch" },
  "Classic":     { label: "Classique",     color: "#ff9500", body: "classic" },
  "Sedan":       { label: "Berline",       color: "#c7c7d1", body: "classic" },
  "SUV":         { label: "SUV",           color: "#34c759", body: "boxy" },
  "Pickup":      { label: "Pick-up",       color: "#c8963c", body: "boxy" },
  "Offroad":     { label: "Tout-terrain",  color: "#9acd32", body: "boxy" }
};

// ---- Silhouettes SVG (couleur via currentColor) ----
function carSVG(body) {
  const wheels =
    '<circle cx="82" cy="112" r="21" fill="#07070c" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>' +
    '<circle cx="82" cy="112" r="9" fill="currentColor" opacity=".5"/>' +
    '<circle cx="242" cy="112" r="21" fill="#07070c" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>' +
    '<circle cx="242" cy="112" r="9" fill="currentColor" opacity=".5"/>';

  const paths = {
    // Coupé / supercar basse
    sport:
      '<path d="M20 112 C20 94 32 90 46 90 L64 90 C70 62 82 50 104 48 L150 48 C178 48 196 58 210 74 L252 84 C284 86 304 90 312 98 C314 104 314 108 312 112 Z"/>',
    // Cabriolet (sans toit)
    open:
      '<path d="M20 112 C20 96 32 92 46 92 L70 92 C78 78 90 74 100 74 L210 74 C224 74 236 78 246 84 C278 88 302 90 312 98 C314 104 314 108 312 112 Z"/>',
    // SUV / pick-up / tout-terrain (haut, droit)
    boxy:
      '<path d="M18 112 C18 94 30 92 44 92 L58 92 C60 70 66 58 80 54 L96 52 L210 52 C226 52 236 56 246 64 L266 74 C286 80 304 84 312 96 C314 104 314 108 312 112 Z"/>',
    // Muscle car (capot long, arrière haut)
    muscle:
      '<path d="M20 112 C20 96 30 92 44 92 L58 92 C62 70 70 60 82 56 L120 52 C150 52 176 62 190 76 C214 82 262 82 288 88 C300 92 312 98 312 106 C312 110 310 112 308 112 Z"/>',
    // Compacte / hot hatch
    hatch:
      '<path d="M22 112 C22 96 32 92 46 92 L60 92 C62 70 70 60 84 58 L104 56 L160 56 C186 56 204 64 218 76 C244 82 278 84 300 90 C310 94 312 104 312 112 Z"/>',
    // Classique (caisse carrée)
    classic:
      '<path d="M20 112 C20 96 32 94 44 94 L58 94 C60 76 68 70 82 68 L96 66 L180 66 C196 66 208 70 218 78 C244 84 282 84 300 90 C310 94 312 104 312 112 Z"/>'
  };

  return (
    '<svg viewBox="0 0 330 134" fill="currentColor" aria-hidden="true">' +
    '<ellipse cx="165" cy="130" rx="150" ry="4" fill="rgba(0,0,0,.45)"/>' +
    (paths[body] || paths.sport) +
    wheels +
    "</svg>"
  );
}

// ---- Performance déterministe par voiture (stable au rechargement) ----
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PERF_BASE = {
  Hypercar: 97, Supercar: 90, Sportscar: 82, Trackday: 85,
  Performance: 78, Coupe: 72, Muscle: 76, "Open-top": 74,
  Rally: 72, "Hot Hatch": 66, Classic: 50, Sedan: 55,
  SUV: 58, Pickup: 50, Offroad: 56
};

function perfOf(car) {
  const base = PERF_BASE[car.cat] ?? 70;
  const varv = hashStr(car.brand + car.model) % 9;
  return Math.max(30, Math.min(100, base - 4 + varv));
}

function tierOf(p) {
  if (p >= 95) return "Légendaire";
  if (p >= 85) return "Élite";
  if (p >= 75) return "Sport";
  if (p >= 60) return "Street";
  return "Stock";
}

// ---- Rendu de la grille ----
const grid = document.getElementById("carGrid");
const countEl = document.getElementById("carCount");
const searchInput = document.getElementById("searchInput");
const brandSelect = document.getElementById("brandSelect");
const catFilterWrap = document.getElementById("catFilters");

let activeCat = "all";

function buildFilters() {
  // Catégories présentes dans le jeu
  const cats = Object.keys(CATEGORIES).filter((c) => CARS.some((car) => car.cat === c));

  const allBtn = document.createElement("button");
  allBtn.className = "cat-btn active";
  allBtn.dataset.cat = "all";
  allBtn.textContent = "Toutes";
  catFilterWrap.appendChild(allBtn);

  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "cat-btn";
    b.dataset.cat = c;
    b.innerHTML = `<span class="dot" style="background:${CATEGORIES[c].color}"></span>${CATEGORIES[c].label}`;
    catFilterWrap.appendChild(b);
  });

  // Constructeurs
  const brands = [...new Set(CARS.map((c) => c.brand))].sort((a, b) => a.localeCompare(b, "fr"));
  brands.forEach((b) => {
    const o = document.createElement("option");
    o.value = b;
    o.textContent = b;
    brandSelect.appendChild(o);
  });
}

function cardHTML(car, i) {
  const cat = CATEGORIES[car.cat] || CATEGORIES.Coupe;
  const perf = perfOf(car);
  const tier = tierOf(perf);
  return (
    `<article class="car-card" data-cat="${car.cat}" data-brand="${car.brand}" data-search="${(car.brand + " " + car.model).toLowerCase()}" style="--accent:${cat.color}">
      <div class="car-top">
        <span class="car-cat" style="background:${cat.color}1f;color:${cat.color};border-color:${cat.color}55">${cat.label}</span>
        <span class="car-year">${car.year}</span>
      </div>
      <div class="car-art">${carSVG(cat.body)}</div>
      <div class="car-info">
        <span class="car-brand">${car.brand}</span>
        <h3 class="car-model">${car.model}</h3>
        <div class="car-perf">
          <div class="perf-head"><span>PERF</span><strong>${perf}</strong><em>${tier}</em></div>
          <div class="perf-bar"><i style="width:${perf}%"></i></div>
        </div>
      </div>
    </article>`
  );
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const brand = brandSelect.value;

  const filtered = CARS.filter((car) => {
    if (activeCat !== "all" && car.cat !== activeCat) return false;
    if (brand !== "all" && car.brand !== brand) return false;
    if (q && !(car.brand + " " + car.model).toLowerCase().includes(q)) return false;
    return true;
  });

  grid.innerHTML = filtered.map(cardHTML).join("");
  countEl.textContent = filtered.length + " / " + CARS.length + " voitures";
}

// ---- Événements ----
searchInput.addEventListener("input", render);
brandSelect.addEventListener("change", render);

catFilterWrap.addEventListener("click", (e) => {
  const btn = e.target.closest(".cat-btn");
  if (!btn) return;
  catFilterWrap.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  activeCat = btn.dataset.cat;
  render();
});

// ---- Reveal au scroll ----
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("revealed");
        io.unobserve(en.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

// ---- Compteurs animés ----
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const dur = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.querySelectorAll("[data-count]").forEach(animateCount);
        statObserver.unobserve(en.target);
      }
    });
  },
  { threshold: 0.5 }
);
const statsEl = document.querySelector(".hero-stats");
if (statsEl) statObserver.observe(statsEl);

// ---- Header / burger / retour haut ----
const header = document.getElementById("header");
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
const toTop = document.getElementById("toTop");

const progressBar = document.getElementById("progressBar");

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 30);
  toTop.classList.toggle("show", window.scrollY > 600);
  const h = document.documentElement;
  const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progressBar.style.width = scrolled + "%";
});

burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
});

navLinks.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    navLinks.classList.remove("open");
    burger.classList.remove("open");
  }
});

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// ---- Année dans le footer ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Init ----
buildFilters();
render();
