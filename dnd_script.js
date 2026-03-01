

/* =========================
    Mini photo game
=========================*/

const photoGameContainer = document.getElementById("photoGame");
const shufflePhotosBtn = document.getElementById("shufflePhotosBtn");
const checkOrderBtn = document.getElementById("checkOrderBtn");
const photoGameResultEl = document.getElementById("photoGameResult");

let currentPhotoSet = [];

const ALL_PHOTOS = [
    { id: "photo1", url: "images/pic_Babi01.png", caption: "Babi 1", date: "2025-01-01"},
    { id: "photo2", url: "images/pic_Babi02.png", caption: "Babi 2", date: "2025-05-10"},
    { id: "photo3", url: "images/pic_Babi03.png", caption: "Babi 3", date: "2025-08-20"},
    { id: "photo4", url: "images/pic_Babi04.png", caption: "Babi Trip 1", date: "2025-11-02"},
    { id: "photo5", url: "images/pic_Babi05.png", caption: "Babi Trip 2", date: "2025-12-24"},
    { id: "photo6", url: "images/pic_Babi06.png", caption: "Babi Trip 3", date: "2026-02-14"},
];

// Fisher-Yates shuffle (unbiased)
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickRandomPhotos() {
    return shuffleArray(ALL_PHOTOS).slice(0, 4);
}

function renderPhotoGame() {
    photoGameContainer.innerHTML = "";
    photoGameResultEl.textContent = "";

    currentPhotoSet.forEach((photo) => {
        const card = document.createElement("div");
        card.className = "photo-card";
        card.draggable = true;
        card.dataset.id = photo.id;

        const img = document.createElement("img");
        img.src = photo.url;
        img.alt = photo.caption;
        img.draggable = false;

        const cap = document.createElement("div");
        cap.className = "photo-caption";
        cap.textContent = photo.caption;

        card.appendChild(img);
        card.appendChild(cap);



        photoGameContainer.appendChild(card);
    });
}

function shufflePhotoGame() {
    currentPhotoSet = pickRandomPhotos();
    renderPhotoGame();
}

function checkPhotoOrder() {
    const cards = Array.from(photoGameContainer.children);
    if (cards.length === 0) return;

    const idToPhoto = Object.fromEntries(currentPhotoSet.map((p) => [p.id, p]));
    const currentOrder = cards.map((card) => idToPhoto[card.dataset.id]);

    const correctOrder = [...currentPhotoSet].sort((a, b) => a.date.localeCompare(b.date));
    const isCorrect = currentOrder.every((p, i) => p.id === correctOrder[i].id);

    if (isCorrect) {
    photoGameResultEl.textContent = "Perfect! You remembered everything in order:)";
    photoGameResultEl.style.color = "#c3347c";
    } else {
    photoGameResultEl.textContent = "Not quite... rearrange and try again!";
    photoGameResultEl.style.color = "#aa4d7f";
}
}

/* =========================
    Drag and Drop handlers
=========================*/

/* =========================
   Reliable Smooth Sortable DnD (HTML5)
   - Keeps 4 slots: 3 cards + 1 placeholder
   - Placeholder position uses left/right of hovered card center
   - Avoids drag-cancel by hiding AFTER drag starts (rAF)
========================= */

let draggedEl = null;

const placeholderEl = document.createElement("div");
placeholderEl.className = "photo-card photo-placeholder";
placeholderEl.draggable = false;

function enableSmoothDnD(container) {
  container.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".photo-card");
    if (!card || card === placeholderEl || card.classList.contains("photo-placeholder")) return;

    draggedEl = card;

    // Add visual drag style (optional)
    card.classList.add("dragging");

    // Make placeholder match card size
    const rect = card.getBoundingClientRect();
    placeholderEl.style.height = `${rect.height}px`;

    // Put placeholder right after dragged element (so layout keeps 4 slots)
    container.insertBefore(placeholderEl, card.nextElementSibling);

    // Make the drag preview look like the card (important before we hide it)
    // If you hide the element later, the preview still shows nicely
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", card.dataset.id || "");
    e.dataTransfer.setDragImage(card, rect.width / 2, rect.height / 2);

    // CRITICAL: hide only AFTER drag has started (next frame)
    // If you hide immediately in dragstart, some browsers cancel the drag.
    requestAnimationFrame(() => {
      if (draggedEl) draggedEl.classList.add("is-hidden");
    });
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault(); // required to allow drop
    if (!draggedEl) return;

    const x = e.clientX;
    const y = e.clientY;

    // Find element under cursor
    const underPointer = document.elementFromPoint(x, y);
    const hoveredCard = underPointer?.closest(".photo-card");

    // If not hovering a real card (or hovering placeholder/dragged hidden),
    // place placeholder at end.
    if (
      !hoveredCard ||
      hoveredCard === placeholderEl ||
      hoveredCard.classList.contains("photo-placeholder") ||
      hoveredCard.classList.contains("is-hidden")
    ) {
      container.appendChild(placeholderEl);
      return;
    }

    // Decide before/after based on left/right of hovered card's center
    const rect = hoveredCard.getBoundingClientRect();
    const midpointX = rect.left + rect.width / 2;

    if (x < midpointX) {
      container.insertBefore(placeholderEl, hoveredCard);
    } else {
      container.insertBefore(placeholderEl, hoveredCard.nextElementSibling);
    }
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!draggedEl) return;

    // Put dragged element where placeholder is
    container.insertBefore(draggedEl, placeholderEl);

    // Cleanup placeholder
    placeholderEl.remove();

    // Unhide dragged element and remove styles
    draggedEl.classList.remove("is-hidden");
    draggedEl.classList.remove("dragging");

    draggedEl = null;
  });

  container.addEventListener("dragend", () => {
    // dragend fires even if dropped outside container
    if (draggedEl) {
      draggedEl.classList.remove("is-hidden");
      draggedEl.classList.remove("dragging");
    }
    draggedEl = null;

    if (placeholderEl.parentNode) placeholderEl.remove();
  });
}


shufflePhotosBtn.addEventListener("click", shufflePhotoGame);
checkOrderBtn.addEventListener("click", checkPhotoOrder);


enableSmoothDnD(photoGameContainer);
shufflePhotoGame();

