const PASSWORD = "1301";

const gate = document.getElementById("gate");
const book = document.getElementById("book");
const input = document.getElementById("password");
const enterBtn = document.getElementById("enter-btn");
const gateError = document.getElementById("gate-error");
const gateHint = document.getElementById("gate-hint");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageIndicator = document.getElementById("page-indicator");
const pages = Array.from(document.querySelectorAll(".page"));
const bgMusic = document.getElementById("bg-music");

let currentPage = 1;
const totalPages = pages.length;
let wrongAttempts = 0;

function showPage(pageNumber) {
  currentPage = Math.min(Math.max(pageNumber, 1), totalPages);
  pages.forEach((page) => {
    page.classList.toggle("active", Number(page.dataset.page) === currentPage);
  });
  pageIndicator.textContent = `Page ${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
  book.scrollTop = 0;
}

function tryStartMusic() {
  if (!bgMusic) return;
  bgMusic.currentTime = 0;
  bgMusic.volume = 0.55;
  bgMusic.play().catch(() => {
    const resume = () => {
      bgMusic.play().catch(() => {});
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
      document.removeEventListener("keydown", resume);
    };

    document.addEventListener("click", resume, { once: true });
    document.addEventListener("touchstart", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
  });
}

function openBook() {
  gate.classList.add("hidden");
  book.classList.remove("hidden");
  showPage(1);
}

enterBtn.addEventListener("click", () => {
  if (input.value.trim() !== PASSWORD) {
    wrongAttempts += 1;
    gateError.textContent = "Mot de passe incorrect. Réessaie mon cœur.";
    if (wrongAttempts >= 2) {
      gateHint.textContent = "Hint : En 4 chiffres : la date à laquelle tu as su que tu m’aimais.";
    }
    return;
  }
  wrongAttempts = 0;
  gateError.textContent = "";
  gateHint.textContent = "";
  openBook();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    enterBtn.click();
  }
});

prevBtn.addEventListener("click", () => showPage(currentPage - 1));
nextBtn.addEventListener("click", () => showPage(currentPage + 1));

document.addEventListener("keydown", (event) => {
  if (book.classList.contains("hidden")) return;
  if (event.key === "ArrowRight") showPage(currentPage + 1);
  if (event.key === "ArrowLeft") showPage(currentPage - 1);
});

tryStartMusic();
