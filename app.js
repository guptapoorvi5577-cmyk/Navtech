// 🔐 AUTH GUARD (RUNS FIRST)
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.replace("./index.html");
  throw new Error("Not logged in");
}


import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import { startEmergency, cancelEmergency } from "./sos.js";

import {
  getFirestore,
  collection,
  onSnapshot
} from
  "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { MapProvider } from "./map.provider.js";

/* ===== FIREBASE ===== */
const firebaseConfig = {
  apiKey: "AIzaSyCt31BARLXsFKuNcQmSDupaAwNH0MV5MRI",
  authDomain: "women-safety-prototype-ea8c1.firebaseapp.com",
  projectId: "women-safety-prototype-ea8c1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ===== STATE ===== */
let currentUserPos = null;
let previewDestination = null;
let cachedCrimeZones = [];
let lastCrimeDraw = 0;
let safePlaces = [];
let mapInitialized = false;
let sosTimer = 300;
let sosInterval = null;
let seededRoutes = [];
let routeSimulated = false;
let lastCrimeCenter = null;
let initialCrimeDrawDone = false;
let lastSafeDraw = 0;
let lastSafeCenter = null;
let lastCrimeTime = 0;

function redrawSafeZones(force = false) {
  if (!mapInitialized) return;
  if (!currentUserPos) return;
  if (!safePlaces.length) return;

  const now = Date.now();

  if (!lastSafeCenter) {
    force = true;
  }

  if (!force && lastSafeCenter) {
    const moved = distanceInMeters(lastSafeCenter, currentUserPos);
    if (moved < 120 && now - lastSafeDraw < 8000) return;
  }

  lastSafeCenter = { ...currentUserPos };
  lastSafeDraw = now;

  const nearby = getNearbySafePlaces(700);
  console.log("SAFE PLACES NEARBY:", nearby.length);
  MapProvider.drawSafePlaces(nearby);

}

function showView(id) {

  document.querySelectorAll(".content-view").forEach(v => {
    v.classList.remove("active");
    v.style.display = "none";
  });

  const targetView = document.getElementById(id);
  if (targetView) {
    targetView.classList.add("active");

    targetView.style.display = (id === "safety-map-view") ? "flex" : "block";
  }

  if (id === "safety-map-view") {

    if (!mapInitialized) {
      MapProvider.init("map", [26.7606, 83.3732], 13);
      mapInitialized = true;
    }

    const sim = document.getElementById("simulateRoute");
    if (sim) {
      sim.disabled = true;
      sim.style.opacity = "0.5";
    }

    setTimeout(() => {
      redrawSafeZones(true);     
      drawNearbyCrimeZones(true);  
    }, 400);

    MapProvider.refresh();
  }


}
window.addEventListener("DOMContentLoaded", () => {

  window.addEventListener("DOMContentLoaded", () => {
  const name = localStorage.getItem("safePathUserName") || "User";
  const nameHolder = document.getElementById("userName");
  if (nameHolder) nameHolder.textContent = name;

  showView("welcome-view"); // ✅ FIRST VIEW AFTER LOGIN
});





  // ================= SIGN IN NAVIGATION =================

  const hour = new Date().getHours();
const greeting =
  hour < 12 ? "Good morning" :
  hour < 18 ? "Good afternoon" :
  "Good evening";

const savedName = localStorage.getItem("safePathUserName") || "User";

const heading = document.querySelector(".topbar h1");
if (heading) {
  heading.innerHTML = `${greeting}, <span id="userName">${savedName}</span>`;
}

function updateUserName(name) {
  localStorage.setItem("safePathUserName", name);
  const el = document.getElementById("userName");
  if (el) el.textContent = name;
}

 



  

const toggle = document.getElementById("toggleInstructions");

toggle?.addEventListener("change", () => {
  const osrmPanel = document.querySelector(".leaflet-routing-container");

  if (!osrmPanel) return;

  osrmPanel.style.display = toggle.checked ? "block" : "none";
});

document.getElementById("openLogin")?.addEventListener("click", () => {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("safePathUserName");
  window.location.replace("login.html");
});


document.getElementById("backToSettings")
  ?.addEventListener("click", () => {
    showView("settings-view");
  });

  document.getElementById("btnHome")?.addEventListener("click", () => {
  showView("welcome-view");
});


document.getElementById("signinForm")
  ?.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("signinName").value.trim();
    const email = document.getElementById("signinEmail").value;
    const password = document.getElementById("signinPassword").value;

    if (!name) {
      alert("Please enter your name");
      return;
    }

    console.log("Signing in:", name, email);

    const nameHolder = document.getElementById("userName");
    if (nameHolder) {
      nameHolder.textContent = name;
    }

    alert(`Welcome, ${name}!`);
    showView("welcome-view");
  });

  

  const sosBtn = document.getElementById("sosFloat");
  const overlay = document.getElementById("sos-overlay");
  const imSafeBtn = document.getElementById("imSafeBtn");
  const goBackBtn = document.getElementById("goBackBtn");
  const sosIcon = document.getElementById("sosIcon");

  const timerBadge = document.createElement("span");
  timerBadge.className = "sos-timer";
  sosBtn.appendChild(timerBadge);

  const altBtn = document.getElementById("alternateRoute");
  altBtn.style.display = "inline-flex";
  altBtn.style.opacity = "0.5";
  altBtn.disabled = true;

  function updateBadge() {
    const m = Math.floor(sosTimer / 60);
    const s = sosTimer % 60;
    timerBadge.textContent = `${m}:${String(s).padStart(2, "0")}`;

    if (sosTimer <= 0) {
      sosIcon.textContent = "🚨";
    } else if (sosTimer <= 60) {
      sosIcon.textContent = "⏳";
    } else {
      sosIcon.textContent = "⚠";
    }
    sosBtn.classList.toggle("urgent", sosTimer <= 60);
    sosIcon.classList.toggle("urgent", sosTimer <= 60);
  }
  document.getElementById("backFromShare")
    ?.addEventListener("click", () => {
      showView("welcome-view");
    });


  /* ===== VOICE ACTIVATION SOS ===== */
  const voiceToggle = document.getElementById("voiceActivation");
  let recognition;

  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript.toLowerCase();

      if (transcript.includes("hey safepath i need help")) {
        startEmergency();
      }
    };
  }
  document.getElementById("btnShareLocation")
    ?.addEventListener("click", openShareLocationView);

  voiceToggle?.addEventListener("change", (e) => {
    if (e.target.checked) {
      recognition?.start();
    } else {
      recognition?.stop();
    }
  });


  function goToSafestRoute() {
    if (!currentUserPos || !previewDestination) return;

    const candidates = seededRoutes.filter(r =>
      r?.start && r?.end &&
      distanceInMeters(r.start, currentUserPos) < 500 &&
      distanceInMeters(r.end, previewDestination) < 500
    );

    candidates.sort((a, b) => b.safety_score - a.safety_score);

    window._safestRoutes = candidates;

    showView("route-view");

    renderRouteView(candidates);
  }


  // ===== RESTORE SETTINGS & THEME FEATURES =====

  document.getElementById("btnSettings")
    ?.addEventListener("click", () => {
      showView("settings-view");
    });

  const darkModeBtn = document.getElementById("darkModeToggle");
  darkModeBtn?.addEventListener("change", () => {
    document.body.classList.toggle("dark-theme");
  });

  

  function startSosTimer() {
    if (sosInterval) clearInterval(sosInterval);

    sosInterval = setInterval(() => {
      sosTimer--;
      updateBadge();

      if (sosTimer <= 0) {
        overlay.style.display = "none";
        showView("emergency-view");
      }

    }, 1000);
  }

  updateBadge();
  startSosTimer();

  sosBtn.addEventListener("click", () => {
    overlay.style.display = "flex";
  });

  imSafeBtn.addEventListener("click", () => {
    sosTimer = 300;
    updateBadge();
    startSosTimer();
    overlay.style.display = "none";
  });

  goBackBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });


  /* ================= NAVIGATION ================= */
document.getElementById("alternateRoute")?.addEventListener("click", () => {

  // 🚫 Block until simulate route is clicked at least once
  if (!routeSimulated) {
    showSelectDestinationPrompt();
    return;
  }

  // ✅ Allowed only after simulation
  showView("route-view");

  const view = document.getElementById("route-view");

  view.innerHTML = `
    <div class="route-view-header">
      <h3>🛡️ Alternate Routes</h3>
      <p>AI-suggested safer alternatives for your journey</p>
    </div>
  `;

  const routes = generateFakeAlternateRoutes();

  routes.forEach((r, i) => {
    const scoreClass =
      r.safety_score >= 80 ? "safe" :
      r.safety_score >= 60 ? "medium" :
      "risky";

    const card = document.createElement("div");
    card.className = "alt-route-card";

    card.innerHTML = `
      <div class="alt-route-title">
        Route ${i + 1}: ${r.label}
      </div>
      <span class="alt-route-score ${scoreClass}">
        Safety Score: ${r.safety_score}%
      </span>
    `;

    view.appendChild(card);
  });
});


  document.querySelector(".emergency-call")
    ?.addEventListener("click", () => showView("emergency-view"));

  document.getElementById("confirmSOS")
    ?.addEventListener("click", startEmergency);


  document.getElementById("cancelSOS")
    ?.addEventListener("click", () => {
      cancelEmergency();
      showView("welcome-view");
    });


  /* ================= ACTION CARDS ================= */
  document.getElementById("btnSafety")
    ?.addEventListener("click", () => showView("safety-map-view"));

document.getElementById("btnRoute")
  ?.addEventListener("click", () => {

    // 🚫 Simulate route never clicked
    if (!routeSimulated) {
      showSelectDestinationPrompt();
      return;
    }

    // ✅ Only after simulation
    goToSafestRoute();
  });

  /* ================= FIREBASE CRIME ZONES ================= */
  const crimeZonesRef = collection(db, "crimeZones");
  onSnapshot(crimeZonesRef, snap => {
    cachedCrimeZones = snap.docs.map(d => d.data());
  });

  const safePlacesRef = collection(db, "safePlaces");

  onSnapshot(safePlacesRef, snap => {
    safePlaces = snap.docs.map(d => d.data());
    redrawSafeZones();
  });
  /* ================= SEEDED SAFE ROUTES ================= */
  const routesRef = collection(db, "routes");

  onSnapshot(routesRef, snap => {
    seededRoutes = snap.docs.map(d => d.data());
  });


  /* ================= GPS TRACKING ================= */
  navigator.geolocation.watchPosition(
    pos => {
      currentUserPos = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      MapProvider.setUser(currentUserPos);

      redrawSafeZones();

      if (lastCrimeDraw === 0) {
        drawNearbyCrimeZones();
        lastCrimeDraw = Date.now();
      } else {
        const now = Date.now();
        if (now - lastCrimeDraw > 2000) {
          drawNearbyCrimeZones();
          lastCrimeDraw = now;
        }
      }

      checkAutoCheckIn();
    },
    err => console.error("GPS error:", err),
    { enableHighAccuracy: true }
  );


  /* ===== AUTO CHECK-IN ===== */
  function checkAutoCheckIn() {
    const toggle = document.getElementById("autoCheckIn");
    if (!toggle?.checked || !currentUserPos) return;

    safePlaces.forEach(place => {
      const dist = distanceInMeters(currentUserPos, {
        lat: place.lat,
        lng: place.lng
      });

      if (dist < 50) {
        console.log("Auto check-in at:", place.name);
      }
    });
  }

  /* ===== INCOGNITO MODE ===== */
  document.getElementById("incognitoMode")?.addEventListener("change", e => {
    if (e.target.checked) {
      console.log("Incognito Mode ON: Location sharing paused");
    }
  });


  MapProvider.onClick(pos => {
    previewDestination = pos;
    MapProvider.previewDestination(pos);

    const sim = document.getElementById("simulateRoute");
    const panel = document.getElementById("route-panel");


    sim.disabled = false;
    sim.style.opacity = "1";
    sim.style.cursor = "pointer";

    panel.style.opacity = "0";
    panel.style.visibility = "hidden";
    panel.style.pointerEvents = "none";

    routeSimulated = false;
    altBtn.disabled = true;
    altBtn.style.opacity = "0.5";
  });

  document.getElementById("simulateRoute")?.addEventListener("click", () => {
    if (!currentUserPos || !previewDestination) return;

    MapProvider.drawRoute([currentUserPos, previewDestination]);

    setTimeout(() => {
    const osrmPanel = document.querySelector(".leaflet-routing-container");
    const toggle = document.getElementById("toggleInstructions");

    if (!osrmPanel) return;

    moveOsrmPanelIntoRouteStats();

    osrmPanel.style.display = toggle?.checked ? "block" : "none";
  }, 300);

    MapProvider.confirmDestination(previewDestination);

    const candidates = seededRoutes.filter(r =>
      r?.start && r?.end &&
      distanceInMeters(r.start, currentUserPos) < 500 &&
      distanceInMeters(r.end, previewDestination) < 500
    );

    window._altRoutes = candidates
      .sort((a, b) => b.safety_score - a.safety_score)
      .slice(0, 3);

    altBtn.disabled = false;
    altBtn.style.opacity = "1";
    altBtn.style.cursor = "pointer";

    const sim = document.getElementById("simulateRoute");
    sim.disabled = true;
    sim.style.opacity = "0.5";

    routeSimulated = true;
  });

  // ✅ SHOW HOME (WELCOME) VIEW AFTER LOGIN
showView("welcome-view");

});

function renderRouteView(routes) {
  const view = document.getElementById("route-view");

  view.innerHTML = `
    <h3>🛡️ Safest Routes</h3>
    <p>AI-ranked safest paths based on live risk data</p>
  `;

  if (!routes.length) {
    view.innerHTML += `<p>No safe routes found.</p>`;
    return;
  }


  routes.forEach((r, i) => {
    const div = document.createElement("div");
    div.style.padding = "12px";
    div.style.marginTop = "10px";routes.for
    div.style.border = "1px solid #e5e7eb";
    div.style.borderRadius = "12px";
    div.style.cursor = "pointer";

    div.innerHTML = `
      <b>#${i + 1} — ${r.label}</b><br>
      Safety Score: <strong>${r.safety_score}/100</strong>
    `;

    div.onclick = () => {
      showView("safety-map-view");
      MapProvider.drawRoute([r.start, r.end]);
    };

    view.appendChild(div);
  });
}
document.getElementById("btnHelpCenter")?.addEventListener("click", () => {
  alert("Redirecting to SafePath Help Center & FAQs");
});

document.getElementById("btnPrivacy")?.addEventListener("click", () => {
  alert("Your data is encrypted and never sold.");
});


function renderSafestRoutes(routes) {
  const panel = document.getElementById("route-panel");
  panel.innerHTML = "";

  routes.forEach((r, i) => {
    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.cursor = "pointer";

    div.innerHTML = `
      <b>Route ${i + 1}</b><br>
      ${r.label || "Alternate Path"}<br>
      Safety: <strong>${r.safety_score}%</strong>
    `;

    div.onclick = () => {
      MapProvider.drawRoute([r.start, r.end]);
    };

    panel.appendChild(div);
  });

  panel.style.visibility = "visible";
  panel.style.opacity = "1";
  panel.style.pointerEvents = "auto";
}


function drawNearbyCrimeZones(force = false) {
  if (!mapInitialized) return;
  if (!currentUserPos) return;

  if (!initialCrimeDrawDone) {
    initialCrimeDrawDone = true;
  } else if (!force && lastCrimeCenter) {
    const moved = distanceInMeters(lastCrimeCenter, currentUserPos);
    if (moved < 150) return;
  }

  lastCrimeCenter = { ...currentUserPos };

  const nearby = cachedCrimeZones.filter(z =>
    distanceInMeters(currentUserPos, {
      lat: z.lat,
      lng: z.lng
    }) <= 3000
  );
  console.log("CRIME ZONES NEARBY:", nearby.length);
  MapProvider.drawCrimeZones(nearby);
}

function moveOsrmPanelIntoRouteStats() {
  const osrmPanel = document.querySelector(".leaflet-routing-container");
  const target = document.getElementById("route-panel");

  if (!osrmPanel || !target) return;

  if (osrmPanel.parentElement === target) return;

  osrmPanel.style.position = "static";
  osrmPanel.style.width = "100%";
  osrmPanel.style.marginTop = "10px";
  osrmPanel.style.boxShadow = "none";

  target.appendChild(osrmPanel);
}

function getNearbySafePlaces(radius = 700) {
  if (!currentUserPos) return [];

  return safePlaces.filter(p =>
    distanceInMeters(currentUserPos, {
      lat: p.lat,
      lng: p.lng
    }) <= radius
  );
}

/* ================= DISTANCE (HAVERSINE) ================= */
function distanceInMeters(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;

  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

function getMatchingRoutes() {
  if (!currentUserPos || !previewDestination) return [];

  return seededRoutes.filter(r =>
    r?.start && r?.end &&
    distanceInMeters(r.start, currentUserPos) < 500 &&
    distanceInMeters(r.end, previewDestination) < 500
  );
}

function showSelectDestinationPrompt() {
  const view = document.getElementById("route-view");
  showView("route-view");

  view.innerHTML = `
    <div class="route-view-header">
      <h3>📍 Destination Required</h3>
      <p>Please select a destination on the map to see safe routes.</p>
    </div>

    <div style="
      margin-top:20px;
      padding:16px;
      border-radius:14px;
      background:#fff7ed;
      border:1px solid #fed7aa;
      color:#9a3412;
      font-size:14px;
    ">
      👉 Tap anywhere on the map to choose your destination.<br>
      👉 Then click <b>Simulate Route</b>.
    </div>
  `;
}

function calculateRouteSafety(routeCoords = []) {
  if (!routeCoords.length || !cachedCrimeZones.length) {
    return Math.floor(80 + Math.random() * 10);
  }

  let score = 90;

  routeCoords.forEach(pt => {
    cachedCrimeZones.forEach(z => {
      const d = distanceInMeters(
        { lat: pt.lat, lng: pt.lng },
        { lat: z.lat, lng: z.lng }
      );

      if (d < 200 && z.level === "high") score -= 45;
      else if (d < 250 && z.level === "medium") score -= 25;
      else if (d < 300 && z.level === "low") score -= 10;
    });
  });

  return Math.max(30, Math.min(95, Math.round(score)));
}
function generateFakeAlternateRoutes() {
  return [
    {
      label: "Route A (via Market Road)",
      safety_score: Math.floor(65 + Math.random() * 20)
    },
    {
      label: "Route B (via Residential Area)",
      safety_score: Math.floor(60 + Math.random() * 25)
    }
  ];
}
function openShareLocationView() {
  showView("share-location-view");

  const title = document.getElementById("share-title");
  const content = document.getElementById("share-content");

  if (!title || !content) return;

  if (!currentUserPos) {
    title.textContent = "GPS Error";
    content.innerHTML = `
      <p style="color:#dc2626;">Unable to detect your current location.</p>
    `;
    return;
  }

  const { lat, lng } = currentUserPos;
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;

  title.textContent = "📍 Location Shared";

  content.innerHTML = `
    <p>
      Your live location is shared with <b>Emergency Contacts</b>.
    </p>

    <p>
      Tracking is active from your current position.
    </p>

    <div style="
      margin-top:12px;
      padding:12px;
      border-radius:12px;
      background:#f9fafb;
      border:1px solid #e5e7eb;
    ">
      <b>Coordinates</b><br>
      Latitude: ${lat.toFixed(6)}<br>
      Longitude: ${lng.toFixed(6)}
    </div>

    <a href="${mapLink}" target="_blank"
       style="
         display:inline-block;
         margin-top:14px;
         padding:10px 14px;
         border-radius:10px;
         background:#2563eb;
         color:#fff;
         font-weight:600;
         text-decoration:none;
       ">
      📍 Open in Google Maps
    </a>
  `;
}



