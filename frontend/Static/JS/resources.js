document.addEventListener("DOMContentLoaded", () => {
  const levelSelect = document.getElementById("filter");
  const typeSelect = document.getElementById("typeFilter");
  const sortSelect = document.getElementById("sort");
  const searchInput = document.getElementById("search");
  const grid = document.getElementById("resourceGrid");

  function getCards() {
    return Array.from(grid.querySelectorAll(".card"));
  }

  function applyFilters() {
    const levelVal = levelSelect.value.toLowerCase();
    const typeVal = typeSelect.value.toLowerCase();
    const searchVal = searchInput.value.toLowerCase();
    const sortVal = sortSelect.value;

    const cards = getCards();

    cards.forEach(card => {
      const level = card.dataset.level.toLowerCase();
      const type = card.dataset.type.toLowerCase();
      const text = card.textContent.toLowerCase();

      const matchesLevel = levelVal === "all" || level === levelVal;
      const matchesType = typeVal === "all" || type === typeVal;
      const matchesSearch = searchVal === "" || text.includes(searchVal);

      card.style.display = (matchesLevel && matchesType && matchesSearch) ? "" : "none";
    });

    // Sort visible cards
    const visibleCards = cards.filter(c => c.style.display !== "none");

    visibleCards.sort((a, b) => {
      if (sortVal === "name") {
        return a.querySelector("h3").textContent.trim().localeCompare(
               b.querySelector("h3").textContent.trim());
      } else if (sortVal === "level") {
        const order = ["beginner", "intermediate", "advanced", "superior"];
        return order.indexOf(a.dataset.level) - order.indexOf(b.dataset.level);
      }
      return 0;
    });

    visibleCards.forEach(card => grid.appendChild(card));
  }

  // Event listeners
  [levelSelect, typeSelect, sortSelect].forEach(select => select.addEventListener("change", applyFilters));
  searchInput.addEventListener("input", applyFilters);

  // Initialize
  applyFilters();
});
