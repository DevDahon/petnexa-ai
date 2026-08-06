import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { fontFamily, radii, shadow, typeScale } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { VetMapProps } from "./vet-map.types";
import { formatDistance, getDirectionsUrl } from "@/services/vetClinics";

export default function VetMapWeb({
  userLocation,
  clinics,
  selectedId,
  onSelectClinic,
  loading,
}: VetMapProps) {
  const { isDark, themePalette } = useAppData();
  const centerLat = userLocation?.lat ?? 14.5995;
  const centerLng = userLocation?.lng ?? 120.9842;

  const tileLayer = "https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}";
  const tileAttrib = '&copy; Google Maps';

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

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width:100%; height:100%; margin:0; padding:0; background:${isDark ? "#0F172A" : "#F8FAFC"}; font-family: sans-serif; }
    .leaflet-popup-content-wrapper { border-radius: 14px; background: ${isDark ? "#1E293B" : "#FFFFFF"}; color: ${isDark ? "#F8FAFC" : "#0F172A"}; box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
    .leaflet-popup-tip { background: ${isDark ? "#1E293B" : "#FFFFFF"}; }
    .clinic-title { font-weight: 800; font-size: 14px; color: ${isDark ? "#F8FAFC" : "#0F172A"}; margin-bottom: 2px; }
    .clinic-addr { font-size: 12px; color: ${isDark ? "#94A3B8" : "#64748B"}; margin-bottom: 6px; }
    .clinic-btn { display: inline-block; background: #0D9488; color: #fff; text-decoration: none; padding: 5px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; margin-top: 4px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('${tileLayer}', {
      maxZoom: 19,
      attribution: '${tileAttrib}'
    }).addTo(map);

    var userIcon = L.divIcon({
      html: '<div style="background:#0D9488;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 10px rgba(13,148,136,0.6)"></div>',
      iconSize: [24,24],
      className: ''
    });

    L.marker([${centerLat}, ${centerLng}], { icon: userIcon }).addTo(map).bindPopup("<b>Your Location</b>");

    var clinicsData = ${clinicsJson};
    clinicsData.forEach(function(c) {
      var isSel = c.isSelected;
      var bg = isSel ? '#0D9488' : (c.isFavorite ? '#E11D48' : '${isDark ? "#334155" : "#1E293B"}');
      var icon = L.divIcon({
        html: '<div style="background:'+bg+';color:#fff;width:28px;height:28px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;box-shadow:0 3px 8px rgba(0,0,0,0.3)">🏥</div>',
        iconSize: [32,32],
        className: ''
      });

      var marker = L.marker([c.lat, c.lng], { icon: icon }).addTo(map);
      var pop = '<div class="clinic-title">' + c.name + '</div>' +
                '<div class="clinic-addr">' + c.address + ' (' + c.distance + ')</div>' +
                '<a class="clinic-btn" href="' + c.directionsUrl + '" target="_blank">Get Directions ➔</a>';
      marker.bindPopup(pop);

      marker.on('click', function() {
        if (window.parent) {
          window.parent.postMessage({ type: 'SELECT_CLINIC', id: c.id }, '*');
        }
      });

      if (isSel) {
        marker.openPopup();
      }
    });
  </script>
</body>
</html>`;
  };

  return (
    <View style={[styles.webMapContainer, { backgroundColor: themePalette.background }]}>
      <iframe
        srcDoc={generateLeafletHtml()}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Vet Map"
      />
      {loading && (
        <View style={[styles.webMapOverlay, { backgroundColor: isDark ? "rgba(30,41,59,0.92)" : "rgba(255,255,255,0.92)" }]}>
          <ActivityIndicator size="small" color={themePalette.teal} />
          <Text style={[styles.webMapLoadingText, { color: themePalette.text }]}>Finding nearby clinics…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    position: "relative",
  },
  webMapOverlay: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    ...shadow.sm,
  },
  webMapLoadingText: {
    fontFamily: fontFamily.medium,
    fontSize: typeScale.label,
  },
});
