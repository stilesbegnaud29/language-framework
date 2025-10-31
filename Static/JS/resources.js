// === Grab elements ===
const levelSelect = document.getElementById("filter");
const typeSelect = document.getElementById("typeFilter");
const sortSelect = document.getElementById("sort");
const grid = document.getElementById("resourceGrid");

// === Helper ===
function getCards() {
  return Array.from(grid.querySelectorAll(".card"));
}

// === Apply filters and sort ===
function applyFilters() {
  const levelVal = levelSelect.value.toLowerCase();
  const typeVal = typeSelect.value.toLowerCase();
  const sortVal = sortSelect.value;

  const cards = getCards();

  // Filter cards by level & type
  cards.forEach(card => {
    const level = card.dataset.level.toLowerCase();
    const type = card.dataset.type.toLowerCase();

    const matchesLevel = levelVal === "all" || level === levelVal;
    const matchesType = typeVal === "all" || type === typeVal;

    // show/hide card
    card.style.display = (matchesLevel && matchesType) ? "" : "none";
  });

  // Sort visible cards
  const visibleCards = cards.filter(c => c.style.display !== "none");

  visibleCards.sort((a, b) => {
    if (sortVal === "name") {
      const nameA = a.querySelector("h3").textContent.trim();
      const nameB = b.querySelector("h3").textContent.trim();
      return nameA.localeCompare(nameB);
    } else if (sortVal === "level") {
      const order = ["beginner", "intermediate", "advanced", "superior"];
      return order.indexOf(a.dataset.level) - order.indexOf(b.dataset.level);
    }
    return 0;
  });

  // Re-append sorted visible cards
  visibleCards.forEach(card => grid.appendChild(card));
}

// === Event listeners ===
[levelSelect, typeSelect, sortSelect].forEach(select => {
  select.addEventListener("change", applyFilters);
});

// === Initialize on load ===
document.addEventListener("DOMContentLoaded", applyFilters);
