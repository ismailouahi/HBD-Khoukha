const PASSWORD = "13011990";
const WORDS = ["confiance", "bonheur", "sécurité", "douceur", "sérénité", "amour", "paix", "tendresse", "sincérité", "légèreté"];

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
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

const ACTIVE_WORDS = isCoarsePointer ? WORDS.slice(0, 6) : WORDS;
const CLICK_COOLDOWN = isCoarsePointer ? 280 : 400;
const FX_SCALE = isCoarsePointer ? 0.45 : 1;
const DISABLE_WORD_BLUR = isCoarsePointer;
const MAX_CRACKS = isCoarsePointer ? 18 : 34;
const MAX_RIPPLES = isCoarsePointer ? 10 : 20;
const MAX_SPARKLES = isCoarsePointer ? 90 : 180;
const MAX_SHARDS = isCoarsePointer ? 55 : 110;

let width = innerWidth, height = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
let radius = 150, center = { x: 0, y: 0 };
let words = [], cracks = [], ripples = [], sparkles = [], shards = [], bgDust = [];
let brokenCount = 0, cooldownUntil = 0, endingStarted = false, finalClickArmed = false;
let ambientDim = 0, shakeTimer = 0, lastTime = performance.now();

function setupWords() {
  wordLayer.innerHTML = "";
  const mobile = matchMedia("(max-width: 700px)").matches;
  words = ACTIVE_WORDS.map((text, i) => {
    const el = document.createElement("span");
    el.className = "word";
    el.textContent = text;
    wordLayer.appendChild(el);
    return {
      text, el, broken: false,
      angle: (i / ACTIVE_WORDS.length) * Math.PI * 2,
      speed: (mobile ? 0.0044 : 0.0036) * (Math.random() * 0.32 + 0.84),
      orbitX: radius + (mobile ? 58 : 86) + Math.random() * (mobile ? 45 : 70),
      orbitY: radius * 0.55 + Math.random() * (mobile ? 36 : 56),
      phase: Math.random() * Math.PI * 2,
      wobble: 0
    };
  });
}

function shatterWordVisual(target) {
  const count = Math.round(Math.min(16, Math.max(10, target.text.length + 3)) * FX_SCALE);
  for (let i = 0; i < count; i++) {
    const crumb = document.createElement("span");
    crumb.className = "word-crumb";
    crumb.textContent = target.text[Math.floor(Math.random() * target.text.length)] || "•";
    crumb.style.left = `${target.x}px`;
    crumb.style.top = `${target.y}px`;
    crumb.style.setProperty("--dx", `${(Math.random() - 0.5) * 140}px`);
    crumb.style.setProperty("--dy", `${(Math.random() - 0.5) * 90 - 22}px`);
    crumb.style.setProperty("--rot", `${(Math.random() - 0.5) * 180}deg`);
    crumb.style.setProperty("--delay", `${Math.random() * 120}ms`);
    wordLayer.appendChild(crumb);
    crumb.addEventListener("animationend", () => crumb.remove(), { once: true });
  }
}

function resize() {
  width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  bgCanvas.width = width * dpr; bgCanvas.height = height * dpr;
  bgCanvas.style.width = `${width}px`; bgCanvas.style.height = `${height}px`;
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  center = { x: width / 2, y: height / 2 };
  const sphereSize = Math.max(255, Math.min(width * 0.34, 430));
  sphereWrap.style.width = `${sphereSize}px`;
  radius = sphereSize / 2;
  sphereCanvas.width = Math.floor(700 * dpr); sphereCanvas.height = Math.floor(700 * dpr);
  sphereCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  setupWords();
  const dustCount = reduced ? 24 : (isCoarsePointer ? 28 : 52);
  bgDust = Array.from({ length: dustCount }, () => ({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.9 + 0.2, v: Math.random() * 0.12 + 0.03, a: Math.random() * 0.38 + 0.08 }));
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
  drawCracks(r); drawRipples(); drawSparkles(); drawShards(); sphereCtx.restore();
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
function drawShards() {
  shards.forEach((f) => {
    sphereCtx.save();
    sphereCtx.translate(f.x, f.y);
    sphereCtx.rotate(f.rot);
    sphereCtx.fillStyle = `rgba(237,228,208,${f.a})`;
    sphereCtx.beginPath();
    sphereCtx.moveTo(0, -f.size);
    sphereCtx.lineTo(f.size * 0.75, f.size * 0.5);
    sphereCtx.lineTo(-f.size * 0.85, f.size * 0.45);
    sphereCtx.closePath();
    sphereCtx.fill();
    sphereCtx.restore();
  });
}

function addCrack(hitX, hitY) {
  const depth = brokenCount / ACTIVE_WORDS.length;
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
  if (cracks.length > MAX_CRACKS) cracks.splice(0, cracks.length - MAX_CRACKS);
}


function breakNextWord() {
  const alive = words.filter(w => !w.broken); if (!alive.length) return;
  const target = alive[Math.floor(Math.random() * alive.length)]; target.broken = true; target.el.classList.add("broken");
  shatterWordVisual(target);
  const shardX = (target.x - center.x) * (700 / (radius * 2)) + 350;
  const shardY = (target.y - center.y) * (700 / (radius * 2)) + 350;
  const sparkleBurst = Math.max(8, Math.round(22 * FX_SCALE));
  const shardBurst = Math.max(5, Math.round(14 * FX_SCALE));
  for (let i = 0; i < sparkleBurst; i++) sparkles.push({ x: shardX, y: shardY, vx: (Math.random() - 0.5) * 1.8, vy: Math.random() * 1.5 + 0.2, a: 0.7, s: Math.random() * 2 + 1, gold: Math.random() > 0.45 });
  for (let i = 0; i < shardBurst; i++) shards.push({ x: shardX, y: shardY, vx: (Math.random() - 0.5) * 2.6, vy: (Math.random() - 0.4) * 2.4, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.32, a: 0.75, size: Math.random() * 2.2 + 1.8 });
  if (sparkles.length > MAX_SPARKLES) sparkles.splice(0, sparkles.length - MAX_SPARKLES);
  if (shards.length > MAX_SHARDS) shards.splice(0, shards.length - MAX_SHARDS);
  brokenCount++;

  if (brokenCount >= ACTIVE_WORDS.length && !endingStarted && !finalClickArmed) {
    finalClickArmed = true;
    setTimeout(() => {
      if (!endingStarted && finalClickArmed) {
        finalClickArmed = false;
        triggerFinalBreak();
      }
    }, reduced ? 220 : (isCoarsePointer ? 520 : 980));
  }
}

function updateWords(dt, now) {
  words.forEach((w) => {
    if (w.broken) return;
    const instability = (brokenCount / ACTIVE_WORDS.length) * 0.005;
    w.angle += (w.speed + instability + Math.sin(w.phase + now * 0.001) * 0.0009) * dt;
    const z = Math.sin(w.angle + w.phase);
    const x = center.x + Math.cos(w.angle) * w.orbitX;
    const y = center.y + Math.sin(w.angle) * w.orbitY * 0.75;
    w.x = x; w.y = y;
    const scale = 0.72 + ((z + 1) / 2) * 0.66;
    const alpha = 0.2 + ((z + 1) / 2) * 0.8;
    w.el.style.left = `${x}px`; w.el.style.top = `${y}px`;
    w.el.style.opacity = alpha.toFixed(3);
    w.el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    if (!DISABLE_WORD_BLUR) {
      w.el.style.filter = `blur(${(1 - (z + 1) / 2) * 2.2}px)`;
    } else if (w.el.style.filter) {
      w.el.style.filter = "";
    }
    w.el.style.zIndex = `${Math.floor(scale * 100)}`;
  });
}

function updateParticles(dt) {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.a -= 0.016 * dt;
    if (s.a <= 0) { sparkles.splice(i, 1); continue; }
    s.x += s.vx || 0;
    s.y += s.vy || 0.3;
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.a -= 0.018 * dt;
    if (r.a <= 0) { ripples.splice(i, 1); continue; }
    r.radius += 2.2 * dt;
  }
  for (let i = shards.length - 1; i >= 0; i--) {
    const f = shards[i];
    f.a -= 0.024 * dt;
    if (f.a <= 0) { shards.splice(i, 1); continue; }
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vy += 0.04 * dt;
    f.rot += f.vr * dt;
  }
  if (shakeTimer > 0) shakeTimer -= 16 * dt;
}

function drawBackground(dt) {
  if (!bgDust.length) return;
  bgCtx.clearRect(0, 0, width, height);
  bgDust.forEach(p => {
    p.y += p.v * dt; if (p.y > height + 5) { p.y = -4; p.x = Math.random() * width; }
    bgCtx.fillStyle = `rgba(213,220,255,${p.a * (1 - ambientDim * 0.6)})`;
    bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bgCtx.fill();
  });
}

function animate(now) {
  const dt = Math.min((now - lastTime) / 16.666, 2); lastTime = now;
  drawBackground(dt); updateWords(dt, now); updateParticles(dt); drawSphere(now);
  requestAnimationFrame(animate);
}

function onSpherePointer(ev) {
  if (endingStarted || performance.now() < cooldownUntil) return;
  const rect = sphereWrap.getBoundingClientRect();
  const x = ev.clientX - rect.left - rect.width / 2;
  const y = ev.clientY - rect.top - rect.height / 2;
  if (Math.hypot(x, y) > rect.width / 2) return;
  cooldownUntil = performance.now() + CLICK_COOLDOWN;
  const map = 700 / rect.width;
  addCrack(x, y); breakNextWord();
  ripples.push({ x: x * map + 350, y: y * map + 350, radius: 10, a: 0.55 });
  if (ripples.length > MAX_RIPPLES) ripples.splice(0, ripples.length - MAX_RIPPLES);
  const clickSparkleCount = Math.max(6, Math.round(16 * FX_SCALE));
  for (let i = 0; i < clickSparkleCount; i++) {
    sparkles.push({ x: x * map + 350, y: y * map + 350, vx: (Math.random() - .5) * 2.8, vy: (Math.random() - .2) * 2.2, a: .8, s: Math.random() * 1.8 + .6, gold: Math.random() > .35 });
  }
  if (sparkles.length > MAX_SPARKLES) sparkles.splice(0, sparkles.length - MAX_SPARKLES);
  if (shards.length > MAX_SHARDS) shards.splice(0, shards.length - MAX_SHARDS);
  shakeTimer = reduced ? 0 : 140;
  ambientDim = Math.min(0.86, brokenCount / ACTIVE_WORDS.length * 0.9);
  document.documentElement.style.setProperty("--scene-dim", ambientDim.toFixed(3));
  document.documentElement.style.setProperty("--halo-opacity", `${Math.max(0, 0.95 - ambientDim * 1.1)}`);
}

function triggerFinalBreak() {
  endingStarted = true;
  sphereWrap.removeEventListener("pointerdown", onSpherePointer);
  sphereWrap.classList.add("final-shatter");
  ambientDim = 0.94;
  document.documentElement.style.setProperty("--scene-dim", ambientDim.toFixed(3));
  document.documentElement.style.setProperty("--halo-opacity", "0");
  setTimeout(startEnding, reduced ? 320 : (isCoarsePointer ? 750 : 1400));
}

function checkPassword() {
  if (input.value.trim() === PASSWORD) {
    gate.classList.add("fade-out");
    setTimeout(() => {
      gate.classList.add("hidden");
      scene.classList.remove("hidden");
      sphereWrap.addEventListener("pointerdown", onSpherePointer);
    }, reduced ? 20 : (isCoarsePointer ? 520 : 840));
  } else {
    gateError.textContent = "Ce n’est pas encore la bonne mémoire.";
    input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake");
  }
}

function startEnding() {
  endingStarted = true;
  setTimeout(() => {
    scene.classList.add("hidden"); ending.classList.remove("hidden");
    const l1 = document.getElementById("line-1"), l2 = document.getElementById("line-2"), l3 = document.getElementById("line-3");
    l1.classList.add("show");
    setTimeout(() => l2.classList.add("show"), reduced ? 400 : (isCoarsePointer ? 1200 : 2600));
    setTimeout(() => l3.classList.add("show"), reduced ? 700 : (isCoarsePointer ? 2300 : 5600));
  }, reduced ? 300 : (isCoarsePointer ? 700 : 1200));
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
