// Lien YouTube à personnaliser si besoin.
const youtubeLink = "https://www.youtube.com/watch?v=trxA8EPz8tc";

const screens = Array.from(document.querySelectorAll('.screen'));
const nextButtons = Array.from(document.querySelectorAll('.next-btn'));
const progressIndicator = document.getElementById('progressIndicator');
const playBtn = document.getElementById('playBtn');
const bgMusic = document.getElementById('bgMusic');
const playHint = document.getElementById('playHint');

const totalScreens = screens.length;
let currentIndex = 0;
let isTransitioning = false;


function startBackgroundMusic() {
  if (!bgMusic || !bgMusic.paused) return;
  bgMusic.play().catch(() => {
    // Le navigateur peut bloquer l'autoplay tant qu'il n'y a pas d'interaction utilisateur.
  });
}

function updateIndicator() {
  progressIndicator.textContent = `${currentIndex + 1}/${totalScreens}`;
}

function showScreen(nextIndex) {
  if (isTransitioning || nextIndex === currentIndex || nextIndex >= totalScreens) return;
  isTransitioning = true;

  const current = screens[currentIndex];
  const next = screens[nextIndex];

  current.classList.add('is-leaving');

  setTimeout(() => {
    current.classList.remove('is-active', 'is-leaving');
    current.hidden = true;

    next.hidden = false;
    next.classList.add('is-active');

    currentIndex = nextIndex;
    updateIndicator();
    triggerDecorativeBurst();

    setTimeout(() => {
      isTransitioning = false;
    }, 650);
  }, 420);
}

function triggerDecorativeBurst() {
  const burst = document.createElement('div');
  burst.className = 'screen-burst';

  for (let i = 0; i < 14; i += 1) {
    const conf = document.createElement('span');
    conf.textContent = Math.random() > 0.5 ? '❤' : '✦';
    conf.style.left = `${Math.random() * 100}%`;
    conf.style.animationDelay = `${Math.random() * 0.35}s`;
    conf.style.animationDuration = `${2.1 + Math.random() * 1.2}s`;
    burst.appendChild(conf);
  }

  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 3400);
}

nextButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    startBackgroundMusic();
    showScreen(currentIndex + 1);
  });
});

playBtn.addEventListener('click', () => {
  startBackgroundMusic();
  if (bgMusic) {
    bgMusic.volume = 0.55;
    bgMusic.play().catch(() => {});
  }
  if (playHint) {
    playHint.textContent = 'Bonne écoute ma Khoukha ✨';
  }
  window.open(youtubeLink, '_blank', 'noopener,noreferrer');
});

// Animation de départ (premier écran déjà actif dans le HTML/CSS).
window.addEventListener('load', () => {
  updateIndicator();
});

window.addEventListener('pointerdown', startBackgroundMusic, { once: true });
