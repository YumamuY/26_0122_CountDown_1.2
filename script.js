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
let draggedCardId = null;

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
    const existingPass = localStorage.getItem("STORAGE_PASSWORD");

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

/* =========================
    Drag and Drop handlers
=========================*/

/* =========================
    Update loop + events
=========================*/