// === POPUP FUNCTIONALITY ===
const popup = document.getElementById('popup');
const closeBtn = document.getElementById('closeBtn');
const dontShowAgainCheckbox = document.getElementById('dontShowAgain');
const helpBtn = document.getElementById('helpBtn');

// Check if popup should be hidden
const hidePopup = localStorage.getItem('hidePopup');

// Show popup only if user hasn’t dismissed it
if (hidePopup !== 'true' && popup) {
  popup.classList.add('show');
}

// When user clicks "Close"
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (dontShowAgainCheckbox && dontShowAgainCheckbox.checked) {
      localStorage.setItem('hidePopup', 'true');
    }
    popup.classList.remove('show');
  });
}

// When user clicks "Help" button
if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    // Clear the “do not show again” setting and re-open popup
    localStorage.removeItem('hidePopup');
    popup.classList.add('show');
  });
}

const slides = document.querySelectorAll(".slide");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const dots = document.querySelectorAll(".dot");

let currentIndex = 0;

function showSlide(index) {
  // Wrap around
  if (index >= slides.length) index = 0;
  if (index < 0) index = slides.length - 1;
  currentIndex = index;

  // Move the slide strip
  const slidesContainer = document.querySelector(".slides");
  slidesContainer.style.transform = `translateX(-${index * 100}%)`;

  // Update dots
  dots.forEach(dot => dot.classList.remove("active"));
  dots[index].classList.add("active");
}

// Event listeners for buttons
nextBtn.addEventListener("click", () => showSlide(currentIndex + 1));
prevBtn.addEventListener("click", () => showSlide(currentIndex - 1));

// Dots click behavior
dots.forEach(dot => {
  dot.addEventListener("click", (e) => {
    const index = parseInt(e.target.dataset.index);
    showSlide(index);
  });
});


// Initialize the first slide
showSlide(0);
