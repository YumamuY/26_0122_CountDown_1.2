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
        const enteredPass = prompt("Enter your password to chagne the target date!");
        if (enteredPass === null) {
            statusTextEl.textContent = "Cancelled✋";
            return false;
        }
        if (enteredPass !== existingPass) {
            statusTextEl.textContent = "Wrong Passwordcro❌";
            return false;
        }
        return true;
    }

    // Set a new password (if not set yet)
    const newPass = prompt("Set a new password (must not be empty)") ;
    if (newPass === null) {
        statusTextEl.textContent = "Cancelled✋";
        return false;
    }
    if (newPass.trim() === "") {
        statusTextEl.textContent = "Password cannot be empty❌";
        return false;
    }

    localStorage.setItem(STORAGE_PASSWORD, newPass.trim());
    return true;
}

// ==== Save date (with timezone handling) ====

// ==== Countdown logic ====


// ==== Mountain progress ====

// ==== Mini game: arrange 4 photos chronologically 

// Check the photo Order

// DnD logic



// ==== Update all====

// ==== Event listeners ====

// ==== Init ====


