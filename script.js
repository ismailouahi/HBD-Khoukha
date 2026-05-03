// Lien YouTube à personnaliser si besoin.
const youtubeLink = "https://www.youtube.com/watch?v=trxA8EPz8tc";

const screens = Array.from(document.querySelectorAll('.screen'));
const nextButtons = Array.from(document.querySelectorAll('.next-btn'));
const progressIndicator = document.getElementById('progressIndicator');
const playBtn = document.getElementById('playBtn');
const bgMusic = document.getElementById('bgMusic');
const playHint = document.getElementById('playHint');
const loveScreen = document.querySelector('[data-screen="4"]');
const accessScreen = document.getElementById('accessScreen');
const accessForm = document.getElementById('accessForm');
const passwordInput = document.getElementById('passwordInput');
const accessError = document.getElementById('accessError');
const romanticApp = document.getElementById('romanticApp');
const validPassword = '159';

const totalScreens = screens.length;
let currentIndex = 0;
let isTransitioning = false;

function startBackgroundMusic() {
  if (!bgMusic || !bgMusic.paused) return;
  bgMusic.play().catch(() => {
    // Le navigateur peut bloquer l'autoplay tant qu'il n'y a pas d'interaction utilisateur.
  });
}

function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function updateIndicator() {
  progressIndicator.textContent = `${currentIndex + 1}/${totalScreens}`;
}

function revealLoveCards() {
  if (!loveScreen) return;
  const cards = Array.from(loveScreen.querySelectorAll('.love-line'));
  cards.forEach((card) => card.classList.remove('is-visible'));

  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('is-visible');
    }, 240 + (index * 280));
  });
}

function runScreenEffects(index) {
  if (index === 3) {
    revealLoveCards();
  }
}

function unlockExperience() {
  if (!accessScreen || !romanticApp || !progressIndicator) return;
  accessScreen.classList.add('is-leaving');

  setTimeout(() => {
    accessScreen.hidden = true;
    romanticApp.hidden = false;
    progressIndicator.hidden = false;

    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.blur();
    }

    updateIndicator();
    runScreenEffects(currentIndex);
  }, 420);
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
    runScreenEffects(currentIndex);

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
  stopBackgroundMusic();
  if (playHint) {
    playHint.textContent = 'Bonne écoute ma Khoukha ✨';
  }
  window.open(youtubeLink, '_blank', 'noopener,noreferrer');
});

window.addEventListener('load', () => {
  if (passwordInput) {
    passwordInput.focus();
  }
});

window.addEventListener('pointerdown', startBackgroundMusic, { once: true });

if (accessForm) {
  accessForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!passwordInput) return;

    const value = passwordInput.value.trim();
    if (value === validPassword) {
      if (accessError) accessError.textContent = '';
      unlockExperience();
      startBackgroundMusic();
      return;
    }

    if (accessError) {
      accessError.textContent = 'Ce n’est pas encore la bonne clé.';
    }
  });
}
