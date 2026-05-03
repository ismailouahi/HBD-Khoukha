// Lien YouTube à personnaliser si besoin.
const youtubeLink = "https://www.youtube.com/watch?v=trxA8EPz8tc";

const screens = Array.from(document.querySelectorAll('.screen'));
const nextButtons = Array.from(document.querySelectorAll('.next-btn'));
const progressIndicator = document.getElementById('progressIndicator');
const playBtn = document.getElementById('playBtn');

let currentIndex = 0;
let isTransitioning = false;

function updateIndicator() {
  progressIndicator.textContent = `${currentIndex + 1}/4`;
}

function showScreen(nextIndex) {
  if (isTransitioning || nextIndex === currentIndex || nextIndex >= screens.length) return;
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

    setTimeout(() => {
      isTransitioning = false;
    }, 650);
  }, 420);
}

nextButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    showScreen(currentIndex + 1);
  });
});

playBtn.addEventListener('click', () => {
  window.open(youtubeLink, '_blank', 'noopener,noreferrer');
});

// Animation de départ (premier écran déjà actif dans le HTML/CSS).
window.addEventListener('load', () => {
  updateIndicator();
});
