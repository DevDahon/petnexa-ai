import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { fontFamily, palette, radii, shadow, typeScale } from "@/constants/theme";
import { useAppData } from "@/context/AppContext";
import { formatDistance, getDirectionsUrl } from "@/services/vetClinics";
import { VetMapProps } from "./vet-map.types";

function PulsingUserDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 2.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [scale, opacity]);

  return (
    <View style={styles.userDotOuter}>
      <Animated.View style={[styles.userDotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.userDotCore} />
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
];

const cleanPoiMapStyle = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];

export default function VetMapNative({
  userLocation,
  clinics,
  selectedId,
  onSelectClinic,
  onToggleFavorite,
  loading,
}: VetMapProps) {
  const { isDark } = useAppData();
  const mapRef = useRef<MapView>(null);

  const mapInitialRegion = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      }
    : {
        latitude: 14.5995,
        longitude: 120.9842,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        500
      );
    }
  }, [userLocation]);

  useEffect(() => {
    if (selectedId && mapRef.current) {
      const target = clinics.find((c) => c.id === selectedId);
      if (target) {
        mapRef.current.animateToRegion(
          {
            latitude: target.lat,
            longitude: target.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          500
        );
      }
    }
  }, [selectedId, clinics]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapInitialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        toolbarEnabled={false}
      >
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={999}
          >
            <PulsingUserDot />
          </Marker>
        )}

        {clinics.map((clinic) => {
          const isSelected = selectedId === clinic.id;
          const isFav = clinic.isFavorite;

          const pinColor = isSelected
            ? palette.navy
            : isFav
            ? "#E11D48"
            : palette.teal;

          return (
            <Marker
              key={clinic.id}
              coordinate={{ latitude: clinic.lat, longitude: clinic.lng }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => onSelectClinic(clinic)}
            >
              <View
                style={[
                  styles.markerPin,
                  { backgroundColor: pinColor },
                  isSelected && styles.markerPinSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={isFav ? "heart" : "medical-bag"}
                  size={14}
                  color="#fff"
                />
              </View>
              <View
                style={[
                  styles.markerTail,
                  { borderTopColor: pinColor },
                ]}
              />
              <Callout tooltip onPress={() => onSelectClinic(clinic)}>
                <View style={styles.callout}>
                  <View style={styles.calloutHeader}>
                    <Text style={styles.calloutName} numberOfLines={2}>{clinic.name}</Text>
                    {onToggleFavorite && (
                      <TouchableOpacity onPress={() => onToggleFavorite(clinic)} style={{ padding: 2 }}>
                        <MaterialCommunityIcons
                          name={isFav ? "heart" : "heart-outline"}
                          size={18}
                          color={isFav ? "#E11D48" : palette.muted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.calloutAddress} numberOfLines={2}>{clinic.address}</Text>
                  <Text style={styles.calloutDistance}>{formatDistance(clinic.distance)} away</Text>
                  <View style={styles.calloutActions}>
                    {clinic.phone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${clinic.phone}`)}
                        style={styles.calloutBtn}
                      >
                        <MaterialCommunityIcons name="phone" size={12} color={palette.teal} />
                        <Text style={styles.calloutBtnText}>Call</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(getDirectionsUrl(clinic.lat, clinic.lng, clinic.name))
                      }
                      style={[styles.calloutBtn, styles.calloutBtnPrimary]}
                    >
                      <MaterialCommunityIcons name="navigation-variant" size={12} color="#fff" />
                      <Text style={[styles.calloutBtnText, { color: "#fff" }]}>Directions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator size="small" color={palette.teal} />
          <Text style={styles.mapLoadingText}>Finding clinics…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapLoadingOverlay: {
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
  mapLoadingText: {
    fontFamily: fontFamily.medium,
    fontSize: typeScale.label,
    color: palette.text,
  },
  userDotOuter: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userDotCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#2563EB",
    borderWidth: 2.5,
    borderColor: "#fff",
    position: "absolute",
    ...shadow.sm,
  },
  userDotRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(37,99,235,0.25)",
    position: "absolute",
  },
  markerPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: palette.teal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#fff",
    ...shadow.sm,
  },
  markerPinSelected: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: palette.teal,
    alignSelf: "center",
    marginTop: -1,
  },
  callout: {
    backgroundColor: "#fff",
    borderRadius: radii.md,
    padding: 14,
    width: 220,
    ...shadow.md,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 6,
  },
  calloutName: {
    fontFamily: fontFamily.semiBold,
    fontSize: typeScale.bodySmall,
    color: palette.text,
    marginBottom: 4,
    flex: 1,
  },
  calloutAddress: {
    fontFamily: fontFamily.regular,
    fontSize: typeScale.caption,
    color: palette.muted,
    marginBottom: 6,
  },
  calloutDistance: {
    fontFamily: fontFamily.medium,
    fontSize: typeScale.caption,
    color: palette.teal,
    marginBottom: 10,
  },
  calloutActions: {
    flexDirection: "row",
    gap: 8,
  },
  calloutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.teal,
  },
  calloutBtnPrimary: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
    flex: 1,
    justifyContent: "center",
  },
  calloutBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: palette.teal,
  },
});
