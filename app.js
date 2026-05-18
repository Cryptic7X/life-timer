const STORAGE_KEY_BD = 'lifeTimer_birthdate';
const STORAGE_KEY_LE = 'lifeTimer_lifeExpectancy';
const STORAGE_KEY_TZ = 'lifeTimer_timezone';

let timerInterval;
let currentTimezoneOffset = 5.5;

function init() {
  document.getElementById('birthdate').max = new Date().toISOString().split('T')[0];
  
  const savedBD = localStorage.getItem(STORAGE_KEY_BD);
  const savedLE = localStorage.getItem(STORAGE_KEY_LE);
  const savedTZ = localStorage.getItem(STORAGE_KEY_TZ) || '5.5';
  
  if (savedBD && savedLE) {
    startTimer(savedBD, parseFloat(savedLE), parseFloat(savedTZ));
  } else {
    showSetup();
  }
  
  document.getElementById('country').addEventListener('change', function() {
    const customDiv = document.getElementById('customExpectancy');
    if (this.value === 'custom') {
      customDiv.classList.remove('hidden');
    } else {
      customDiv.classList.add('hidden');
    }
  });
}

function showSetup() {
  document.getElementById('setupScreen').classList.remove('hidden');
  document.getElementById('timerScreen').classList.add('hidden');
  if (timerInterval) clearInterval(timerInterval);
}

function showSettings() {
  const savedBD = localStorage.getItem(STORAGE_KEY_BD);
  const savedLE = localStorage.getItem(STORAGE_KEY_LE);
  const savedTZ = localStorage.getItem(STORAGE_KEY_TZ) || '5.5';
  
  if (savedBD) {
    document.getElementById('birthdate').value = savedBD;
  }
  
  if (savedTZ) {
    document.getElementById('timezone').value = savedTZ;
  }
  
  const countrySelect = document.getElementById('country');
  const matchingOption = Array.from(countrySelect.options).find(opt => opt.value === savedLE);
  
  if (matchingOption) {
    countrySelect.value = savedLE;
  } else {
    countrySelect.value = 'custom';
    document.getElementById('customExpectancy').classList.remove('hidden');
    document.getElementById('customYears').value = savedLE;
  }
  
  showSetup();
}

function saveSettings() {
  const birthdate = document.getElementById('birthdate').value;
  if (!birthdate) {
    alert('Please select your birthdate');
    return;
  }
  
  let lifeExpectancy;
  const countryValue = document.getElementById('country').value;
  
  if (countryValue === 'custom') {
    lifeExpectancy = parseFloat(document.getElementById('customYears').value);
  } else {
    lifeExpectancy = parseFloat(countryValue);
  }
  
  const timezone = parseFloat(document.getElementById('timezone').value);
  
  localStorage.setItem(STORAGE_KEY_BD, birthdate);
  localStorage.setItem(STORAGE_KEY_LE, lifeExpectancy.toString());
  localStorage.setItem(STORAGE_KEY_TZ, timezone.toString());
  
  startTimer(birthdate, lifeExpectancy, timezone);
}

function getCurrentTimeInTimezone(tzOffsetHours) {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return utcTime + (tzOffsetHours * 3600000);
}

function getMidnightInTimezone(year, month, day, tzOffsetHours) {
  const midnightUTC = Date.UTC(year, month, day, 0, 0, 0, 0);
  return midnightUTC - (tzOffsetHours * 3600000);
}

function getMidnightTodayInTimezone(tzOffsetHours) {
  const nowInTz = getCurrentTimeInTimezone(tzOffsetHours);
  const dateInTz = new Date(nowInTz);
  
  const year = dateInTz.getUTCFullYear();
  const month = dateInTz.getUTCMonth();
  const day = dateInTz.getUTCDate();
  
  return getMidnightInTimezone(year, month, day, tzOffsetHours);
}

function getNextMidnightInTimezone(tzOffsetHours) {
  const midnightToday = getMidnightTodayInTimezone(tzOffsetHours);
  const now = new Date().getTime();
  
  if (now >= midnightToday) {
    return midnightToday + (24 * 3600000);
  } else {
    return midnightToday;
  }
}

function startTimer(birthdate, lifeExpectancy, tzOffsetHours) {
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('timerScreen').classList.remove('hidden');
  
  currentTimezoneOffset = tzOffsetHours;
  
  const [year, month, day] = birthdate.split('-');
  const birthDate = new Date(getMidnightInTimezone(parseInt(year), parseInt(month) - 1, parseInt(day), tzOffsetHours));
  
  const totalDaysInLife = Math.round(lifeExpectancy * 365.25);
  
  function updateTimer() {
    const now = new Date();
    
    const midnightToday = getMidnightTodayInTimezone(currentTimezoneOffset);
    const daysSinceBirth = Math.floor((midnightToday - birthDate.getTime()) / (24 * 3600000));
    const daysRemaining = totalDaysInLife - daysSinceBirth;
    
    const endOfLifeTimestamp = midnightToday + (daysRemaining * 24 * 3600000);
    const endOfLife = new Date(endOfLifeTimestamp);
    
    const lived = now - birthDate;
    const remaining = endOfLife - now;
    
    if (remaining <= 0) {
      document.getElementById('clockTime').textContent = '00:000:00:00:00';
      document.getElementById('progressFill').style.width = '100%';
      document.getElementById('progressText').textContent = 'Life Lived: 100.00%';
      clearInterval(timerInterval);
      return;
    }
    
    const nextMidnight = getNextMidnightInTimezone(currentTimezoneOffset);
    const timeUntilMidnight = nextMidnight - now.getTime();
    
    const hoursUntilMidnight = Math.floor(timeUntilMidnight / 3600000);
    const minutesUntilMidnight = Math.floor((timeUntilMidnight % 3600000) / 60000);
    const secondsUntilMidnight = Math.floor((timeUntilMidnight % 60000) / 1000);
    
    const years = Math.floor(daysRemaining / 365);
    const days = daysRemaining % 365;
    
    const timeString = `${String(years).padStart(2, '0')}:${String(days).padStart(3, '0')}:${String(hoursUntilMidnight).padStart(2, '0')}:${String(minutesUntilMidnight).padStart(2, '0')}:${String(secondsUntilMidnight).padStart(2, '0')}`;
    document.getElementById('clockTime').textContent = timeString;
    
    const totalLife = endOfLife - birthDate;
    const livedPercent = (lived / totalLife) * 100;
    document.getElementById('progressFill').style.width = livedPercent.toFixed(2) + '%';
    document.getElementById('progressText').textContent = `Life Lived: ${livedPercent.toFixed(2)}%`;
    
    const currentAge = Math.floor((now - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    document.getElementById('currentAge').textContent = currentAge;
    document.getElementById('daysLeft').textContent = daysRemaining.toLocaleString();
    document.getElementById('hoursLeft').textContent = (daysRemaining * 24 + hoursUntilMidnight).toLocaleString();
  }
  
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker registration failed:', err));
}

init();
