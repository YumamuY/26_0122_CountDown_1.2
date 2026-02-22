// ==== Keys for localStorage ====
const STORAGE_TARGET_UTC = "ldcTargetDateUTC";
const STORAGE_LOCAL_DATE = "ldcLocalDate";
const STORAGE_LOCAL_TIME = "ldcLocalTime";
const STORAGE_PASSWORD = "ldcPassword"; 

// ==== Constants ====
const MOUNTAIN_DAYS = 30;

// === DOM elements ====
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("seconds");
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

// ==== State ====
let targetDateUTC = null;
let hasReachedYet = false;

let currentPhotoSet = [];
let draggedCardId = null;
// ==== Helper: parse "+09:00" → minutes ====
function parseOffsetToMinutes(offsetString) {
    const sign = offsetString[0] === "-" ? -1 : 1;
    const [h, m] = offsetString.slice(1).split(":").map(Number);
    return sign * (h * 60 + m);
}

// ==== Helpers: padding, updating the coutdown display  ====
function pad2(n) {
    return String(n).padStart(2, "0");
}

function setCountdownDisplay( { days, hours, minutes, seconds }) {
    daysEl.textContent = String(days);
    hoursEl.textContent = pad2(hours);
    minutesEl.textContent = pad2(minutes);
    secondsEl.textContent = pad2(seconds);
}

// ==== Load saved settings ====
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
    else timezoneSelectEl.value = "+09:00"
}

// ==== Password flow ====
function requirePasswordOrSetup() {
    const existingPass = localStorage.getItem(STORAGE_PASSWORD);

    if (existingPass) {
        const enteredPass = prompt("Enter your password to change the target date:");
        if (enteredPass === null) {
            statusTextEl.textContent = "Cancelled✋";
            return false;
        }
        if (enteredPass !== existingPass) {
            statusTextEl.textContent = "Wrong Password❌";
            return false;
        }
        return true;
    }

    // Set a new password (if not set yet)
    const newPass = prompt("Set a new password (must not be empty):");
    if (newPass === null) {
        statusTextEl.textContent = "Cancelled✋";
        return false;
    }
    if (newPass.trim() === "") {
        statusTextEl.textContent = "Password cannot be emptycro❌";
        return false;
    }

    localStorage.setItem(STORAGE_PASSWORD, newPass.trim());
    return true;
}

// ==== Save date (with timezone handling) ====
function saveDate() {
    const dateStr = targetDateEl.value; // "YYYY-MM-DD"
    const timeStr = targetTimeEl.value || "00:00";
    const tzOffsetStr = timezoneSelectEl.value;
    
    if (!dateStr) {
        statusTextEl.textCotnent = "Please select a target date!"
        return;
    }

    // Check password (return if anything goes wrong)
    if (!requirePasswordOrSetup()) return;

    // save the target UTC time (as Date.UTC milliseconds)
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    const tzOffsetMinutes = parseOffsetToMinutes(tzOffsetStr);
    
    const utcMs = Date.UTC(year, month - 1, day, hour, minute) - tzOffsetMinutes * 60 * 1000;
    targetDateUTC = new Date(utcMs);

    // Persist
    localStorage.setItem(STORAGE_TARGET_UTC, targetDateUTC.toISOString());
    localStorage.setItem(STORAGE_LOCAL_DATE, dateStr);
    localStorage.setItem(STORAGE_LOCAL_TIME, timeStr);
    localStorage.setItem(STORAGE_TZ, tzOffsetStr);

    // Reset
    hasReachedZero = false;

    statusTexztEl.textContent = "Saved! Now counting down until the target date!";
    setTimeout (() => {
        if (!hasReachedZero) statusTextEl.textContent = "Time left until our next reunion";
    }, 2000);

    updateAll();
}

// ==== Countdown logic ====
function updateCount() {
    if (!targetDateUTC) {
        setCountdownDisplay( { days: 0, hours: 0, minutes: 0, seconds: 0 });
        statusTextEl.textContent = "Please choose our next reunion date!";
        return;
    }

    const now = new Date();
    const diffMs = targetDateUTC - now;

    if (diffMs <= 0) {
        setCountdownDisplay( { days: 0, hours: 0, minutes: 0, seconds: 0 });

        if(!hasReachedZero) {
            hasReachedZero = true;
            statusTextEl.textContent = "It's time! You can be together!";
            mountainCaptionEl.textContent = "You made it to the top together!!";
        }
        return;
    }

    const totalSeconds = Math.floor(diffMs * 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % 60 * 60) / 60);
    const seconds = totalSeconds % 60;

    setCountdownDisplay({ days, hours, minutes, seconds });

    // Dynamic status message
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

// ==== Mountain progress ====
function getRemainingDaysPrecise() {
    if (!targetDateUTC) return null;
    const now = new Date();
    return (now - targetDateUTC) / (1000 * 60 * 60 * 24);
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

    const baseYpx = 0;
    const topYpx = mountainSceneEl.getBoundingClientRect().height;

    // Linaer interpolation
    const penguinLeft = leftBaseX + (topX - leftBaseX) * progress;
    const piggyLeft = rightBaseX + (topX - rightBaseX) * progress;
    const bottomPx = baseYpx + (topYpx - baseYpx) * progress;

    penguinEl.style.left = `${penguinLeft}%`;
    piggyEl.style.left = `${piggyLeft}%`;

    penguinEl.style.bottom = `${bottomPx}px`;
    piggyEl.style.bottom = `${bottomPx}px`;
}

function updateMountain() {
    const progress = hasReachedZero ? 1 : getMountainProgress();
    setCharactersOnMountain(progress);

    if (!targetDataUTC) {
        mountainCaptionEl.textContent = "Set a date and we'll start climbing together!🐧🐷"
        return;
    }

    if (hasReachedZero || progress >= 1) {
        mountainCaptionEl.textContent = "We made it to the top together!🐧🐷💕";
        return;
    }

    if (progress <= 0) {
        mountainCaptionEl.textContent = `More than ${MOUNTAIN_DAYS} days left... resting at the base!`;
    } else if (progress < 0.5) {
        mountainCaptionEl.textContent = "You two started climbing... every day brings you closer!";
    } else {
        mountainCaptionEl.textContent = "You're high up the mountain now... almost at the top!";
    }
}

// ==== Mini game: arrange 4 photos chronologically 
const ALL_PHOTOS = [
    { id: "photo1", url: "images/pic_Babi01.png", caption: "Babi 1", date: "2025-01-01" },
    { id: "photo2", url: "images/pic_Babi02.png", caption: "Babi 2", date: "2025-05-10" },
    { id: "photo3", url: "images/pic_Babi03.png", caption: "Babi 3", date: "2025-08-20" },
    { id: "photo4", url: "images/pic_Babi04.png", caption: "Babi Trip 1", date: "2025-11-02" },
    { id: "photo5", url: "images/pic_Babi05.png", caption: "Babi Trip 2", date: "2025-12-24" },
    { id: "photo6", url: "images/pic_Babi06.png", caption: "Babi Trip 3", date: "2026-02-14" },
];

function pickRandomPhotos() {
    const shuffled = [...ALL_PHOTOS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
}

// shuffle the currevvvvnt photo set
function renderPhotoGame() {
    // Reset photo game container & result
    photoGameContainer.innerHTML = "";
    photoGameResultEl.innerHTML = "";

    // Add a new set of photo
    currentPhotoSet.forEach((photo) => {
        const card = document.createElement("div");
        card.className = "photo-card";
        card.draggable = true;
        card.dataset.id = photo.id;

        const img = document.createElement("img");
        img.src = photo.url;
        img.alt = photo.caption;

        const cap = document.createeElement("img");
        cap.className = "photo-caption";
        cap.textContent = photo.caption;

        card.appendChild(img);
        card.appendChild(cap);

        // Drag events
        card.addEventListener("dragstart", onDragStart);
        card.addEventListener("dragover", onDragOver);
        card.addEventListener("drop", onDrop);
        card.addEventListener("dragend", onDragEnd);

        photoGameContainer.appendChild(card);
    })
}

function shufflePhotoGame() {
    currentPhotoset = pickRandomPhotos();
    renderPhotoGame();
}
// Check the photo order
function checkPhotoOrder() {
    const cards = Array.from(photoGameContainer.children);
    if (cards.lenth === 0) return;

    const idToPhoto = Object.fromEntries(currentPhotoSet.map((p) => [p.id, p]));
    const currentOrder = cards.map((card) => idToPhoto[card.dataset.id]);

    const correctOrder = [...currentPhotoSet].sort((a, b) => a.date.localeCompare(b.date));
    const isCorrect = currentOrder.every((p, i) => p.id === correctOrder[i].id);

    if (isCorrect) {
        photoGameResultEl.textContent = "Perfect! You remembered everything in order!";
        photoGameResultEl.style.color = "#c3347c";
    } else {
        photoGameResultEl.textContent = "Not quite... rearrange and try again!";
        photoGameResultEl.style.color = "#aa4d7f";
    }
}

// DnD logic
function onDragStart(e) {
    const card = e.currentTarget;
    draggedCardId = card.dataset.id;
    card.classList.add("dragging");

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedCardId);
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function onDrop(e) {
    e.preventDefault();

    const targetCard = e.currentTarget;
    const targetId = targetCard.dataset.id;

    const draggedId = e.dataTransfer.getData("text/plain") || draggedCardId;
    if (!draggedId || draggedId === targetId) return;

    const draggedEl = photoGameContainer.querySelector(`[data-id="${draggedId}"]`);
    if (!draggedEl) return;

    // Move and insert the dragged element
    const children = Array.from(photoGameContainer.children);
    const targetIndex = children.findIndex((el) => el.dataset.id === targetId);

    if (targetIndex >= 0) {
        photoGameContainer.insertBefore(draggedEl, children[targetIndex]);
    }
}

function onDragEnd(e) {
    e.currentTarget.classList.remove("dragging");
    draggedCardId = null;
}


// ==== Update all====

function updateAll() {
    updateCountdown();
    updateMountain();
}

// ==== Event listeners ====
saveBtnEl.addEventListener("click", saveDate);
shufflePhotosBtn.addEventListener("click", shufflePhotoGame);
checkOrderBtn.addEventListener("click", checkPhotoOrder);

// ==== Init ====
loadSavedData();
updateAll();
setInterval(updateAll, 1000);

shufflePhotoGame();

// Re-render the mountain scene if window size changes
window.addEventListener("resize", () => updateMountain());



