const PASSWORD = "1301";

const gate = document.getElementById("gate");
const book = document.getElementById("book");
const input = document.getElementById("password");
const enterBtn = document.getElementById("enter-btn");
const gateError = document.getElementById("gate-error");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageIndicator = document.getElementById("page-indicator");
const pages = Array.from(document.querySelectorAll(".page"));

let currentPage = 1;
const totalPages = pages.length;

function showPage(pageNumber) {
  currentPage = Math.min(Math.max(pageNumber, 1), totalPages);
  pages.forEach((page) => {
    page.classList.toggle("active", Number(page.dataset.page) === currentPage);
  });
  pageIndicator.textContent = `Page ${currentPage} / ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

function openBook() {
  gate.classList.add("hidden");
  book.classList.remove("hidden");
  showPage(1);
}

enterBtn.addEventListener("click", () => {
  if (input.value.trim() !== PASSWORD) {
    gateError.textContent = "Mot de passe incorrect. Réessaie mon cœur.";
    return;
  }
  gateError.textContent = "";
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
