// sos.js
const PRIMARY_NUMBER = "+9192ytds831";
const EMERGENCY_CONTACTS = [
  "+91abcd960831",
  "+9195vxyz8546"
];

const SOS_DURATION = 5;

let countdown = null;
let timeLeft = SOS_DURATION;
let sosActive = false;

/* ================= START SOS ================= */
export function startEmergency() {
  if (sosActive) return;

  sosActive = true;
  timeLeft = SOS_DURATION;

  updateUI();

  // 🔑 clear any old interval
  if (countdown) {
    clearInterval(countdown);
    countdown = null;
  }

  countdown = setInterval(() => {
    timeLeft--;
    updateUI();

    if (timeLeft <= 0) {
      clearInterval(countdown);
      countdown = null;
      triggerEmergency();
    }
  }, 1000);
}

/* ================= CANCEL SOS ================= */
export function cancelEmergency() {
  if (countdown) {
    clearInterval(countdown);
    countdown = null;
  }

  sosActive = false;
  timeLeft = SOS_DURATION;
  updateUI();
}

/* ================= UI UPDATE ================= */
function updateUI() {
  const el = document.getElementById("sosTime");
  if (el) el.innerText = timeLeft;
}

/* ================= FINAL TRIGGER ================= */
function triggerEmergency() {
  sosActive = false;

  const countdownBox = document.getElementById("sos-countdown-box");
  const statusList = document.getElementById("sos-status-list");
  const confirmBtn = document.getElementById("confirmSOS");

  if (countdownBox) countdownBox.style.display = "none";
  if (statusList) statusList.style.display = "block";
  if (confirmBtn) confirmBtn.style.display = "none";

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const mapLink = `https://maps.google.com/?q=${lat},${lon}`;

      sendSMS(mapLink);
      makeCall();
    },
    () => alert("Location permission required for SOS")
  );
}

/* ================= ACTIONS ================= */
function makeCall() {
  window.location.href = "tel:" + PRIMARY_NUMBER;
}

function sendSMS(mapLink) {
  const msg = encodeURIComponent(
    `🚨 EMERGENCY ALERT!\nI need help.\nMy location:\n${mapLink}`
  );

  EMERGENCY_CONTACTS.forEach(num => {
    window.open(`sms:${num}?body=${msg}`);
  });
}
