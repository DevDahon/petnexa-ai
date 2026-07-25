import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { fontFamily, palette, radii, shadow, typeScale } from "@/constants/theme";
import { VetMapProps } from "./vet-map.types";
import { formatDistance, getDirectionsUrl } from "@/services/vetClinics";

export default function VetMapWeb({
  userLocation,
  clinics,
  selectedId,
  onSelectClinic,
  loading,
}: VetMapProps) {
  const centerLat = userLocation?.lat ?? 14.5995;
  const centerLng = userLocation?.lng ?? 120.9842;

  const generateLeafletHtml = () => {
    const clinicsJson = JSON.stringify(
      clinics.map((c) => ({
        id: c.id,
        name: c.name.replace(/'/g, "\\'"),
        address: c.address.replace(/'/g, "\\'"),
        lat: c.lat,
        lng: c.lng,
        phone: c.phone || "",
        distance: formatDistance(c.distance),
        isFavorite: Boolean(c.isFavorite),
        isSelected: c.id === selectedId,
        directionsUrl: getDirectionsUrl(c.lat, c.lng, c.name),
      }))
    );

    const userLocJson = JSON.stringify(userLocation);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          .custom-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #0D9488;
            color: white;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .custom-pin:hover { transform: scale(1.2); }
          .custom-pin.selected { background: #1E3A8A; width: 40px; height: 40px; border-width: 3px; z-index: 1000 !important; }
          .custom-pin.favorite { background: #E11D48; }
          .user-dot {
            width: 16px; height: 16px; border-radius: 50%; background: #2563EB; border: 3px solid white; box-shadow: 0 0 12px rgba(37,99,235,0.8);
          }
          .leaflet-popup-content-wrapper { border-radius: 14px; padding: 6px; box-shadow: 0 12px 28px rgba(0,0,0,0.18); }
          .popup-card { padding: 8px; font-family: inherit; width: 200px; }
          .popup-title { font-weight: 700; font-size: 14px; color: #0F172A; margin-bottom: 4px; line-height: 1.2; }
          .popup-address { font-size: 12px; color: #64748B; margin-bottom: 6px; line-height: 1.3; }
          .popup-dist { font-size: 11px; font-weight: 600; color: #0D9488; margin-bottom: 8px; }
          .popup-actions { display: flex; gap: 6px; }
          .popup-btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 4px;
            padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 600;
            text-decoration: none; border: none; cursor: pointer;
          }
          .popup-btn-primary { background: #0D9488; color: white; flex: 1; text-align: center; }
          .popup-btn-secondary { background: #CCFBF1; color: #0D9488; text-align: center; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);
          L.control.zoom({ position: 'topright' }).addTo(map);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          const userLoc = ${userLocJson};
          if (userLoc) {
            const userIcon = L.divIcon({
              className: 'user-dot-wrap',
              html: '<div class="user-dot"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map).bindPopup('<b>Your Current Location</b>');
          }

          const clinics = ${clinicsJson};
          const markers = {};

          clinics.forEach(c => {
            const iconClass = c.isSelected ? 'custom-pin selected' : c.isFavorite ? 'custom-pin favorite' : 'custom-pin';
            const iconSymbol = c.isFavorite ? '❤️' : '🏥';

            const icon = L.divIcon({
              className: 'pin-wrap',
              html: '<div class="' + iconClass + '">' + iconSymbol + '</div>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });

            const popupContent = \`
              <div class="popup-card">
                <div class="popup-title">\${c.name}</div>
                <div class="popup-address">\${c.address}</div>
                <div class="popup-dist">📍 \${c.distance} away</div>
                <div class="popup-actions">
                  <a href="\${c.directionsUrl}" target="_blank" class="popup-btn popup-btn-primary">🗺️ Directions</a>
                  \${c.phone ? '<a href="tel:' + c.phone + '" class="popup-btn popup-btn-secondary">📞 Call</a>' : ''}
                </div>
              </div>
            \`;

            const marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(map);
            marker.bindPopup(popupContent);

            marker.on('click', () => {
              window.parent.postMessage({ type: 'SELECT_CLINIC', id: c.id }, '*');
            });

            markers[c.id] = marker;
          });

          const selectedId = "${selectedId || ""}";
          if (selectedId && markers[selectedId]) {
            const sel = clinics.find(c => c.id === selectedId);
            if (sel) {
              map.flyTo([sel.lat, sel.lng], 15);
              markers[selectedId].openPopup();
            }
          }
        </script>
      </body>
      </html>
    `;
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SELECT_CLINIC") {
        const found = clinics.find((c) => c.id === event.data.id);
        if (found) {
          onSelectClinic(found);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [clinics, onSelectClinic]);

  return (
    <View style={styles.webMapContainer}>
      <iframe
        srcDoc={generateLeafletHtml()}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Interactive Vet Clinics Map"
      />

      {loading && (
        <View style={styles.webMapOverlay}>
          <ActivityIndicator size="small" color={palette.teal} />
          <Text style={styles.webMapLoadingText}>Finding nearby clinics…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: palette.background,
  },
  webMapOverlay: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    ...shadow.sm,
  },
  webMapLoadingText: {
    fontFamily: fontFamily.medium,
    fontSize: typeScale.label,
    color: palette.text,
  },
});
