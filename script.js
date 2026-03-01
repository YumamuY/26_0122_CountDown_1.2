"use strict";
/* =========================
    localStorage Keys
=========================*/
const STORAGE_TARGET_UTC = "ldcTargetDateUTC";
const STORAGE_LOCAL_DATE = "ldcLocalDate";
const STORAGE_LOCAL_TIME = "ldcLocalTime";
const STORAGE_TZ = "ldcTimezoneOffset";
const STORAGE_PASSWORD = "ldcPassword";

/* =========================
    Constants
=========================*/
const MOUNTAIN_DAYS = 30;

const SECONDS_PER_MINUTES = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTES;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/* =========================
    DOM Elements    
=========================*/
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const statusTextEl = document.getElementById("statusText");

const targetDateEl = document.getElementById("targetDate");
const targetTimeEl = document.getElementById("targetTime");
const timezoneSelectEl = document.getElementById("timezoneSelect");
const saveBtnEl = document.getElementById("saveDateBtn");

const mountainSceneEl = document.getElementById("mountainScene");
const penguinEl = document.getElementById("penguin");
const piggyEl = document.getElementById("piggy");
const mountainCaptionEl = document.getElementById("mountainCaption");


const photoGameContainer = document.getElementById("photoGame");
const shufflePhotosBtn = document.getElementById("shufflePhotosBtn");
const checkOrderBtn = document.getElementById("checkOrderBtn");
const photoGameResultEl = document.getElementById("photoGameResult");

/* =========================
    Small safety check
=========================*/
function assertEl(el, name) {
    if (!el) throw new ErrorEvent(`Missing DOM element: ${name}`);
}
[
  [daysEl, "days"], [hoursEl, "hours"], [minutesEl, "minutes"], [secondsEl, "seconds"],
  [statusTextEl, "statusText"],
  [targetDateEl, "targetDate"], [targetTimeEl, "targetTime"], [timezoneSelectEl, "timezoneSelect"], [saveBtnEl, "saveDateBtn"],
  [mountainSceneEl, "mountainScene"], [penguinEl, "penguin"], [piggyEl, "piggy"], [mountainCaptionEl, "mountainCaption"],
  [photoGameContainer, "photoGame"], [shufflePhotosBtn, "shufflePhotosBtn"], [checkOrderBtn, "checkOrderBtn"], [photoGameResultEl, "photoGameResult"],
].forEach(([el, name]) => assertEl(el, name));

/* =========================
    State
=========================*/
let targetDateUTC = null;
let hasReachedZero = false;

let currentPhotoSet = [];

/* =========================
    Helpers
=========================*/
function parseOffsetToMinutes(offsetString) {
    const sign = offsetString[0] === "-" ? -1 : 1;
    const [h, m] = offsetString.slice(1).split(":").map(Number);
    return sign * (60 * h + m);
}

function pad2(n) {
    return String(n).padStart(2, "0");
}

function setCountdownDisplay( {days, hours, minutes, seconds}) {
    daysEl.textContent = String(days);
    hoursEl.textContent = pad2(hours);
    minutesEl.textContent = pad2(minutes);
    secondsEl.textContent = pad2(seconds);
}

/* =========================
    Load saved settings
=========================*/
function loadSavedData() {
    const utcIso = localStorage.getItem(STORAGE_TARGET_UTC);
    const localDate = localStorage.getItem(STORAGE_LOCAL_DATE);
    const localTime = localStorage.getItem(STORAGE_LOCAL_TIME);
    const tzOffset = localStorage.getItem(STORAGE_TZ);

    if (utcIso) targetDateUTC = new Date(utcIso);

    if (localDate) targetDateEl.value = localDate;
    if (localTime) targetTimeEl.value = localTime;
    else targetTimeEl.value = "12:00";

    if (tzOffset) timezoneSelectEl.value = tzOffset;
    else timezoneSelectEl.value = "+09:00";
}

/* =========================
    Password flow
=========================*/
function requirePasswordOrSetup() {
    const existingPass = localStorage.getItem(STORAGE_PASSWORD);

    // If password exists, require it
    if (existingPass) {
        const enteredPass = prompt("Password is required!");
        if (enteredPass === null) {
            statusTextEl.textContent = "Cancelled!";
            return false;
        }
        if (enteredPass !== existingPass) {
            statusTextEl.textContent = "Wrong Password❌";
            return false;
        }
        return true;
    }

    // Otherwise, set a new password
    const newPass = prompt("Set a new Password!");
    if (newPass === null) {
        statusTextEl.textContent = "Cancelled";
        return false;
    }
    if (newPass.trim() === "") {
        statusTextEl.textContent = "Password cannot be empty!";
        return false;
    }
    localStorage.setItem(STORAGE_PASSWORD, newPass.trim());
    return true;
}

/* =========================
    Save date (timezone -> UTC)
=========================*/
function saveDate() {
    const dateStr = targetDateEl.value;
    const timeStr = targetTimeEl.value || "00:00";
    const tzOffsetStr = timezoneSelectEl.value;

    if(!dateStr) {
        statusTextEl.textContent = "Please select a target date!";
        return;
    }

    if (!requirePasswordOrSetup()) return;

    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    const tzOffsetMinutes = parseOffsetToMinutes(tzOffsetStr);

    // Convert chosen local time to UTC
    const utcMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetMinutes * 60 * 1000;
    targetDateUTC = new Date(utcMs);

    localStorage.setItem(STORAGE_TARGET_UTC, targetDateUTC.toISOString());
    localStorage.setItem(STORAGE_LOCAL_DATE, dateStr);
    localStorage.setItem(STORAGE_LOCAL_TIME, timeStr);
    localStorage.setItem(STORAGE_TZ, tzOffsetStr);

    hasReachedZero = false;

    statusTextEl.textContent = "Saved! Now counting down!";
    setTimeout(() => {
        if (!hasReachedZero) statusTextEl.textContent = "Time left until our next reunion!";
    }, 1500);

    updateAll();
}

/* =========================
    Countdown logic
=========================*/
function updateCountdown() {
    if (!targetDateUTC) {
        setCountdownDisplay( { days: 0, hours: 0, minutes: 0, seconds: 0});
        statusTextEl.textContent = "Please choose our next reunion date!";
        return;
    }

    const now = new Date();
    const diffMs = targetDateUTC - now;

    if (diffMs <= 0) {
        setCountdownDisplay( { days: 0, hours: 0, minutes: 0, seconds: 0});

        if (!hasReachedZero) {
            hasReachedZero = true;
            statusTextEl.textContent = "It's time! You can be together!";
            mountainCaptionEl.textContent = "You made it to the top together!";
        }
        return;
    }

    const totalSeconds = Math.floor(diffMs / 1000);

    const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
    const hours = Math.floor((totalSeconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTES);
    const seconds = totalSeconds % SECONDS_PER_MINUTES;

    setCountdownDisplay( { days, hours, minutes, seconds} );

    // Dynamically change the status text
    if (days === 0 && hours === 0 && minutes < 60) {
        statusTextEl.textContent = "Almost there... final countdown!";
    } else if (days <= 7) {
        statusTextEl.textContent = "Less than a week left... hang in there!";
    } else if (days <= 30) {
        statusTextEl.textContent = "Getting closer day by day!";
    } else {
        statusTextEl.textContent = "Time left until our next reunion!";
    }
}


/* =========================
    Mountain Progress
=========================*/
function getRemainingDaysPrecise() {
    if (!targetDateUTC) return null;
    const now = new Date();
    return (targetDateUTC - now) / (1000 * 60 * 60 * 24);
}

function getMountainProgress() {
    const remainingDays = getRemainingDaysPrecise();
    if (remainingDays === null) return 0;

    if (remainingDays >= MOUNTAIN_DAYS) return 0;
    if (remainingDays <= 0) return 1;

    return 1 - remainingDays / MOUNTAIN_DAYS;
}

function setCharactersOnMountain(progress) {
    const leftBaseX = 15;
    const rightBaseX = 85;
    const topX = 50;

    const sceneHeight = mountainSceneEl.getBoundingClientRect().height;
    const baseYpx = 0;
    const topYpx = sceneHeight * 0.78;

    const penguinLeft = leftBaseX + (topX - leftBaseX) * progress;
    const piggyLeft = rightBaseX + (topX - rightBaseX) * progress;
    const bottomPx = baseYpx + (topYpx - baseYpx) * progress;

    penguinEl.style.left = `${piggyLeft}%`;
    piggyEl.style.left = `${penguinLeft}%`;
    penguinEl.style.bottom = `${bottomPx}px`;
    piggyEl.style.bottom = `${bottomPx}px`;
}

function updateMountain() {
    const progress = hasReachedZero ? 1 : getMountainProgress();
    setCharactersOnMountain();

    if (!targetDateUTC) {
        mountainCaptionEl.textContent = "Set a goal date and we'll start climbing together!";
        return;
    }

    if (hasReachedZero || progress >= 1) {
        mountainCaptionEl.textContent = "You made it to the top together!";
        return;
    }

    if (progress <= 0) {
        mountainCaptionEl.textContent = `More than ${MOUNTAIN_DAYS} days left...`;
    } else if (progress < 0.5) {
        mountainCaptionEl.textContent = "You two started climbing...";
    } else {
        mountainCaptionEl.textContent = "You're high up the mountain now... almost at the top!";
    }
}

/* =========================
    Mini photo game
=========================*/
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



/* =========================
    Update loop + events
=========================*/
function updateAll() {
    updateCountdown();
    updateMountain();
}

saveBtnEl.addEventListener("click", saveDate);
shufflePhotosBtn.addEventListener("click", shufflePhotoGame);
checkOrderBtn.addEventListener("click", checkPhotoOrder);

loadSavedData();
updateAll();
setInterval(updateAll, 1000);

enableSmoothDnD(photoGameContainer);
shufflePhotoGame();
window.addEventListener("resize", updateMountain());

