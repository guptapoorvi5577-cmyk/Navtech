export const MapProvider = (() => {
  let map;
  let userMarker = null;
  let previewMarker = null;
  let finalMarker = null;
  let dangerLayers = [];
  let hasCenteredOnUser = false;
  let routeControl = null;
  let safeMarkers = [];
  let clickHandler = null;

  // ===== USER / ROUTE ICONS =====
  const userIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const yellowIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const redIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  // ===== SAFE PLACE ICONS (SYMBOL BASED) =====
  const policeIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296216.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28]
  });

  const hospitalIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296208.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28]
  });

  const mallIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28]
  });

  const pharmacyIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/296/296214.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26]
  });

  const fuelIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26]
  });

  const safePlaceIcons = {
    police: policeIcon,
    hospital: hospitalIcon,
    mall: mallIcon,
    pharmacy: pharmacyIcon,
    fuel: fuelIcon,
    default: hospitalIcon
  };



  function init(id, center, zoom) {
    if (map) return;

    map = L.map(id).setView(center, zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 500);

    if (clickHandler) {
      map.on("click", e =>
        clickHandler({ lat: e.latlng.lat, lng: e.latlng.lng })
      );
    }
  }

  function onClick(cb) {
    clickHandler = cb;
    if (!map) return;

    map.off("click");
    map.on("click", e =>
      clickHandler({ lat: e.latlng.lat, lng: e.latlng.lng })
    );
  }

  function setUser(pos) {
    if (!map || !pos) return;

    if (!userMarker) {
      userMarker = L.marker([pos.lat, pos.lng], { icon: userIcon })
        .bindPopup("📍 You are here")
        .addTo(map);
    } else {
      userMarker.setLatLng([pos.lat, pos.lng]);
    }

    if (!hasCenteredOnUser) {
      map.flyTo([pos.lat, pos.lng], 14, { duration: 1 });
      hasCenteredOnUser = true;
    }
  }

  function previewDestination(pos) {
    if (!map || !pos) return;

    if (!previewMarker) {
      previewMarker = L.marker([pos.lat, pos.lng], { icon: yellowIcon }).addTo(map);
    } else {
      previewMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  function confirmDestination(pos) {
    if (!map || !pos) return;

    if (previewMarker) {
      map.removeLayer(previewMarker);
      previewMarker = null;
    }

    if (!finalMarker) {
      finalMarker = L.marker([pos.lat, pos.lng], { icon: redIcon }).addTo(map);
    } else {
      finalMarker.setLatLng([pos.lat, pos.lng]);
    }
  }

  function refresh() {
    if (map) {
      setTimeout(() => map.invalidateSize(), 200);
    }
  }

  function drawCrimeZones(zones = []) {
    if (!map) return;

    dangerLayers.forEach(layer => map.removeLayer(layer));
    dangerLayers = [];

    zones.forEach(z => {
      let radius = 200;
      let color = "#00c853";

      if (z.level === "low") {
        radius = 250;
        color = "#ffeb3b";
      } else if (z.level === "medium") {
        radius = 350;
        color = "#ff9800";
      } else if (z.level === "high") {
        radius = 500;
        color = "#f44336";
      }

      dangerLayers.push(
        L.circle([z.lat, z.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1,
          interactive: false
        }).addTo(map)
      );
    });
  }

  function drawSafePlaces(places = []) {
    if (!map) return;

    safeMarkers.forEach(m => map.removeLayer(m));
    safeMarkers = [];

    places.forEach(p => {
      if (!p.lat || !p.lng) return;

      const icon = safePlaceIcons[p.type] || safePlaceIcons.default;

      const marker = L.marker([p.lat, p.lng], { icon })
        .bindPopup(
          `<b>${p.name || "Safe Place"}</b><br>
         ${p.type || ""}<br>
         24×7`
        )
        .addTo(map);

      safeMarkers.push(marker);
    });
  }

  function drawRoute(points = []) {
    const panel = document.getElementById("route-panel");

    panel.innerHTML = "";
    panel.style.opacity = "0";
    panel.style.visibility = "hidden";
    panel.style.pointerEvents = "none";

    if (!map || points.length < 2 || !L.Routing) {
      console.error("Routing not ready");
      return;
    }

    if (routeControl) {
      map.removeControl(routeControl);
      routeControl = null;
    }

    routeControl = L.Routing.control({
      show: true,
      container: panel,

      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1"
      }),

      waypoints: [
        L.latLng(points[0].lat, points[0].lng),
        L.latLng(points[1].lat, points[1].lng)
      ],

      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      showAlternatives: true,
      createMarker: () => null,

      lineOptions: {
        styles: [{ color: "#35d07f", weight: 4 }]
      }
    });

    routeControl.on("routesfound", e => {
      const coords = e.routes[0].coordinates.map(c => ({
        lat: c.lat,
        lng: c.lng
      }));

      const safety = window.calculateRouteSafety
        ? window.calculateRouteSafety(coords)
        : Math.floor(70 + Math.random() * 20);

      const panel = document.getElementById("route-panel");

      panel.style.opacity = "1";
      panel.style.visibility = "visible";
      panel.style.pointerEvents = "auto";

      const badge = document.createElement("div");
      badge.style.marginBottom = "8px";
      badge.style.padding = "6px 10px";
      badge.style.borderRadius = "10px";
      badge.style.fontWeight = "600";

      badge.style.background =
        safety >= 80 ? "#dcfce7" :
          safety >= 60 ? "#fef3c7" :
            "#fee2e2";

      badge.textContent = `🛡️ Current Route Safety: ${safety}%`;

      panel.prepend(badge);
    });

    routeControl.addTo(map);
  }


  return {
    init,
    onClick,
    setUser,
    previewDestination,
    confirmDestination,
    drawCrimeZones,
    drawSafePlaces,
    drawRoute,
    refresh
  };
})();
