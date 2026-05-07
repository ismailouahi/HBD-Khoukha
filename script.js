const PASSWORD = "13011990";
const WORDS = ["confiance", "bonheur", "sécurité", "douceur", "sérénité", "amour", "paix", "tendresse", "sincérité", "légèreté"];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const gate = document.getElementById("gate");
const scene = document.getElementById("scene");
const ending = document.getElementById("ending");
const input = document.getElementById("password");
const enterBtn = document.getElementById("enter-btn");
const gateError = document.getElementById("gate-error");
const sphereWrap = document.getElementById("sphere-wrap");
const sphereCanvas = document.getElementById("sphere-canvas");
const sphereCtx = sphereCanvas.getContext("2d");
const bgCanvas = document.getElementById("bg-canvas");
const bgCtx = bgCanvas.getContext("2d");
const wordLayer = document.getElementById("word-layer");
const cursor = document.getElementById("cursor");

let width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
let radius = 150, center = { x: 0, y: 0 };
let words = [], cracks = [], ripples = [], sparkles = [], bgDust = [];
let brokenCount = 0, cooldownUntil = 0, endingStarted = false, finalClickArmed = false;
let ambientDim = 0, shakeTimer = 0, lastTime = performance.now();

function setupWords() {
  wordLayer.innerHTML = "";
  const mobile = matchMedia("(max-width: 700px)").matches;
  words = WORDS.map((text, i) => {
    const el = document.createElement("span");
    el.className = "word";
    el.textContent = text;
    wordLayer.appendChild(el);
    return {
      text, el, broken: false,
      angle: (i / WORDS.length) * Math.PI * 2,
      speed: (mobile ? 0.04 : 0.03) * (Math.random() * 0.45 + 0.75),
      orbitX: radius + (mobile ? 58 : 86) + Math.random() * (mobile ? 45 : 70),
      orbitY: radius * 0.55 + Math.random() * (mobile ? 36 : 56),
      phase: Math.random() * Math.PI * 2,
      wobble: 0
    };
  });
}

function resize() {
  width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  bgCanvas.width = width * dpr; bgCanvas.height = height * dpr;
  bgCanvas.style.width = `${width}px`; bgCanvas.style.height = `${height}px`;
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  center = { x: width / 2, y: height / 2 };
  const sphereSize = Math.max(230, Math.min(width * 0.3, 390));
  sphereWrap.style.width = `${sphereSize}px`;
  radius = sphereSize / 2;
  sphereCanvas.width = Math.floor(700 * dpr); sphereCanvas.height = Math.floor(700 * dpr);
  sphereCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  setupWords();
  bgDust = Array.from({ length: reduced ? 24 : 52 }, () => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.9 + 0.2, v: Math.random() * 0.12 + 0.03, a: Math.random() * 0.38 + 0.08 }));
}

function drawSphere(t) {
  const size = 700; const c = size / 2;
  sphereCtx.clearRect(0, 0, size, size);
  const breath = reduced ? 0 : Math.sin(t * 0.0012) * 0.02;
  const r = radius * (1 + breath);
  const ox = shakeTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
  const oy = shakeTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
  sphereCtx.save(); sphereCtx.translate(c + ox, c + oy);

  const halo = sphereCtx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.8);
  halo.addColorStop(0, `rgba(130,165,255,${0.08 - ambientDim * 0.04})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  sphereCtx.fillStyle = halo; sphereCtx.beginPath(); sphereCtx.arc(0, 0, r * 1.8, 0, Math.PI * 2); sphereCtx.fill();

  const glass = sphereCtx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.15, 0, 0, r * 1.1);
  glass.addColorStop(0, "rgba(238,243,255,0.23)"); glass.addColorStop(0.4, "rgba(57,72,110,0.34)");
  glass.addColorStop(0.75, "rgba(20,24,36,0.64)"); glass.addColorStop(1, "rgba(5,7,12,0.95)");
  sphereCtx.fillStyle = glass; sphereCtx.beginPath(); sphereCtx.arc(0, 0, r, 0, Math.PI * 2); sphereCtx.fill();

  sphereCtx.strokeStyle = `rgba(236,242,255,${0.54 - ambientDim * 0.2})`; sphereCtx.lineWidth = 1.1;
  sphereCtx.beginPath(); sphereCtx.arc(0, 0, r - 0.8, 0, Math.PI * 2); sphereCtx.stroke();

  sphereCtx.fillStyle = "rgba(255,255,255,0.2)"; sphereCtx.beginPath(); sphereCtx.ellipse(-r * 0.28, -r * 0.34, r * 0.26, r * 0.15, -0.7, 0, Math.PI * 2); sphereCtx.fill();
  sphereCtx.fillStyle = "rgba(136,125,255,0.1)"; sphereCtx.beginPath(); sphereCtx.ellipse(r * 0.16, -r * 0.22, r * 0.23, r * 0.12, 0.35, 0, Math.PI * 2); sphereCtx.fill();
  sphereCtx.fillStyle = "rgba(118,180,255,0.09)"; sphereCtx.beginPath(); sphereCtx.ellipse(-r * 0.05, r * 0.06, r * 0.35, r * 0.22, 0.4, 0, Math.PI * 2); sphereCtx.fill();
  sphereCtx.fillStyle = `rgba(223,185,116,${0.2 - ambientDim * 0.12})`; sphereCtx.beginPath(); sphereCtx.arc(0, r * 0.66, r * 0.16, 0, Math.PI * 2); sphereCtx.fill();

  sphereCtx.save(); sphereCtx.beginPath(); sphereCtx.arc(0, 0, r, 0, Math.PI * 2); sphereCtx.clip();
  drawCracks(r); drawRipples(); drawSparkles(); sphereCtx.restore();
  sphereCtx.restore();
}

function drawCracks(r) {
  cracks.forEach((crack) => {
    sphereCtx.strokeStyle = `rgba(242,232,205,${0.17 + crack.intensity * 0.35})`;
    sphereCtx.shadowColor = "rgba(255,246,220,0.32)";
    sphereCtx.shadowBlur = 4;
    crack.lines.forEach((line) => {
      sphereCtx.lineWidth = line.w;
      sphereCtx.beginPath(); sphereCtx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) sphereCtx.lineTo(line.points[i].x, line.points[i].y);
      sphereCtx.stroke();
    });
  });
  sphereCtx.shadowBlur = 0;
}

function drawRipples() { ripples.forEach(r => { sphereCtx.strokeStyle = `rgba(248,242,230,${r.a})`; sphereCtx.lineWidth = 1; sphereCtx.beginPath(); sphereCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2); sphereCtx.stroke(); }); }
function drawSparkles() { sparkles.forEach(s => { sphereCtx.fillStyle = `rgba(${s.gold ? "218,188,132" : "255,255,255"},${s.a})`; sphereCtx.fillRect(s.x, s.y, s.s, s.s); }); }

function addCrack(hitX, hitY) {
  const depth = brokenCount / WORDS.length;
  const mainSteps = 8 + Math.floor(depth * 10);
  const branches = 2 + Math.floor(depth * 4);
  const lines = [];
  const spawn = (x, y, angle, len, spread, weight) => {
    const points = [{ x, y }];
    for (let i = 0; i < len; i++) {
      angle += (Math.random() - 0.5) * spread;
      const step = 7 + depth * 6;
      x += Math.cos(angle) * step; y += Math.sin(angle) * step;
      if (Math.hypot(x, y) > radius - 3) break;
      points.push({ x, y });
    }
    if (points.length > 1) lines.push({ points, w: weight });
  };
  const dir = Math.atan2(hitY, hitX) + (Math.random() - 0.5) * 0.6;
  spawn(hitX, hitY, dir, mainSteps, 0.28, 0.7 + depth * 0.6);
  for (let i = 0; i < branches; i++) spawn(hitX, hitY, dir + (Math.random() - 0.5) * 1.8, 4 + Math.random() * mainSteps * 0.7, 0.45, 0.45 + depth * 0.35);
  cracks.push({ lines, intensity: 0.4 + depth * 0.6 });
}

function breakNextWord() {
  const alive = words.filter(w => !w.broken); if (!alive.length) return;
  const target = alive[Math.floor(Math.random() * alive.length)]; target.broken = true; target.el.classList.add("broken");
  for (let i = 0; i < 22; i++) sparkles.push({ x: (target.x - center.x) * (700 / (radius * 2)) + 350, y: (target.y - center.y) * (700 / (radius * 2)) + 350, vx: (Math.random() - 0.5) * 1.8, vy: Math.random() * 1.5 + 0.2, a: 0.7, s: Math.random() * 2 + 1, gold: Math.random() > 0.45 });
  brokenCount++;
}

function updateWords(dt) {
  const remain = Math.max(1, WORDS.length - brokenCount);
  words.forEach((w) => {
    if (w.broken) return;
    const instability = (brokenCount / WORDS.length) * 0.04;
    w.angle += (w.speed + instability + Math.sin(w.phase + performance.now() * 0.001) * 0.003) * dt;
    const z = Math.sin(w.angle + w.phase);
    const x = center.x + Math.cos(w.angle) * w.orbitX;
    const y = center.y + Math.sin(w.angle) * w.orbitY * 0.75;
    w.x = x; w.y = y;
    const scale = 0.72 + ((z + 1) / 2) * 0.66;
    const alpha = 0.2 + ((z + 1) / 2) * 0.8;
    w.el.style.left = `${x}px`; w.el.style.top = `${y}px`;
    w.el.style.opacity = alpha.toFixed(3);
    w.el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    w.el.style.filter = `blur(${(1 - (z + 1) / 2) * 2.2}px)`;
    w.el.style.zIndex = `${Math.floor(scale * 100)}`;
  });
  if (remain === 0 && !endingStarted) finalClickArmed = true;
}

function updateParticles(dt) {
  sparkles = sparkles.filter(s => (s.a -= 0.016 * dt) > 0).map(s => ({ ...s, x: s.x + (s.vx || 0), y: s.y + (s.vy || 0.3) }));
  ripples = ripples.filter(r => (r.a -= 0.018 * dt) > 0).map(r => ({ ...r, radius: r.radius + 2.2 * dt }));
  if (shakeTimer > 0) shakeTimer -= 16 * dt;
}

function drawBackground(dt) {
  bgCtx.clearRect(0, 0, width, height);
  bgDust.forEach(p => {
    p.y += p.v * dt; if (p.y > height + 5) { p.y = -4; p.x = Math.random() * width; }
    bgCtx.fillStyle = `rgba(213,220,255,${p.a * (1 - ambientDim * 0.6)})`;
    bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bgCtx.fill();
  });
}

function animate(now) {
  const dt = Math.min((now - lastTime) / 16.666, 2); lastTime = now;
  drawBackground(dt); updateWords(dt); updateParticles(dt); drawSphere(now);
  requestAnimationFrame(animate);
}

function onSpherePointer(ev) {
  if (endingStarted || performance.now() < cooldownUntil) return;
  if (finalClickArmed) {
    finalClickArmed = false;
    startEnding();
    return;
  }
  const rect = sphereWrap.getBoundingClientRect();
  const x = ev.clientX - rect.left - rect.width / 2;
  const y = ev.clientY - rect.top - rect.height / 2;
  if (Math.hypot(x, y) > rect.width / 2) return;
  cooldownUntil = performance.now() + 400;
  const map = 700 / rect.width;
  addCrack(x, y); breakNextWord();
  ripples.push({ x: x * map + 350, y: y * map + 350, radius: 10, a: 0.55 });
  sparkles.push(...Array.from({ length: 16 }, () => ({ x: x * map + 350, y: y * map + 350, vx: (Math.random() - .5) * 2.8, vy: (Math.random() - .2) * 2.2, a: .8, s: Math.random() * 1.8 + .6, gold: Math.random() > .35 })));
  shakeTimer = reduced ? 0 : 140;
  ambientDim = Math.min(0.86, brokenCount / WORDS.length * 0.9);
  document.documentElement.style.setProperty("--scene-dim", ambientDim.toFixed(3));
  document.documentElement.style.setProperty("--halo-opacity", `${Math.max(0, 0.95 - ambientDim * 1.1)}`);
}

function checkPassword() {
  if (input.value.trim() === PASSWORD) {
    gate.classList.add("fade-out");
    setTimeout(() => {
      gate.classList.add("hidden");
      scene.classList.remove("hidden");
      sphereWrap.addEventListener("pointerdown", onSpherePointer);
    }, reduced ? 20 : 840);
  } else {
    gateError.textContent = "Ce n’est pas encore la bonne mémoire.";
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
  }
}

function startEnding() {
  endingStarted = true;
  sphereWrap.removeEventListener("pointerdown", onSpherePointer);
  setTimeout(() => {
    scene.classList.add("hidden"); ending.classList.remove("hidden");
    const l1 = document.getElementById("line-1"), l2 = document.getElementById("line-2"), l3 = document.getElementById("line-3");
    l1.classList.add("show");
    setTimeout(() => l2.classList.add("show"), reduced ? 400 : 2600);
    setTimeout(() => l3.classList.add("show"), reduced ? 700 : 5600);
  }, reduced ? 300 : 1200);
}

enterBtn.addEventListener("click", checkPassword);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") checkPassword(); });
window.addEventListener("resize", resize);
window.addEventListener("pointermove", (e) => {
  if (!cursor || matchMedia("(hover: none), (pointer: coarse)").matches) return;
  cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`;
});
sphereWrap.addEventListener("pointerenter", () => cursor.classList.add("hover"));
sphereWrap.addEventListener("pointerleave", () => cursor.classList.remove("hover"));

resize();
requestAnimationFrame(animate);
