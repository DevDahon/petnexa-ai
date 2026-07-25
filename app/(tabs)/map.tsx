import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";

import { fontFamily, palette, radii, shadow, spacing, typeScale } from "@/constants/theme";
import {
  fetchNearbyVetClinics,
  formatDistance,
  getDirectionsUrl,
  toggleFavoriteClinicId,
  VetClinic,
} from "@/services/vetClinics";
import VetMap from "@/components/vet-map";
import { useResponsiveLayout } from "@/components/ui";

type FilterKey = "all" | "favorites" | "1km" | "5km";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "favorites", label: "❤️ Favorites" },
  { key: "1km", label: "≤ 1 km" },
  { key: "5km", label: "≤ 5 km" },
];

const SEARCH_RADIUS_M = 10000; // 10 km

function PermissionDeniedView({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredState}>
      <View style={styles.stateIconWrap}>
        <MaterialCommunityIcons name="map-marker-off" size={48} color={palette.muted} />
      </View>
      <Text style={styles.stateTitle}>Location access needed</Text>
      <Text style={styles.stateBody}>
        Petnexa AI needs your location to find vet clinics nearby. Please enable
        Location access in your device Settings.
      </Text>
      <TouchableOpacity
        id="open-settings-btn"
        style={styles.retryBtn}
        onPress={() => {
          ExpoLocation.requestForegroundPermissionsAsync().then(onRetry);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.retryBtnText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.centeredState}>
      <View style={[styles.stateIconWrap, { backgroundColor: palette.dangerSoft }]}>
        <MaterialCommunityIcons name="wifi-alert" size={48} color={palette.danger} />
      </View>
      <Text style={styles.stateTitle}>Couldn't load clinics</Text>
      <Text style={styles.stateBody}>{message}</Text>
      <TouchableOpacity id="retry-btn" style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function LoadingView() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <View style={styles.centeredState}>
      <Animated.View style={[styles.loadingDot, { opacity: pulse }]} />
      <Text style={styles.stateTitle}>Finding nearby clinics…</Text>
      <ActivityIndicator size="large" color={palette.teal} style={{ marginTop: 12 }} />
    </View>
  );
}

function ClinicCard({
  clinic,
  onPress,
  onToggleFavorite,
  selected,
}: {
  clinic: VetClinic;
  onPress: () => void;
  onToggleFavorite: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      id={`clinic-card-${clinic.id}`}
      style={[styles.clinicCard, selected && styles.clinicCardSelected]}
      onPress={onPress}
      android_ripple={{ color: palette.softTeal }}
    >
      <View style={styles.clinicCardLeft}>
        <View
          style={[
            styles.clinicIconWrap,
            clinic.isFavorite
              ? { backgroundColor: "#FFE4E6" }
              : selected && styles.clinicIconWrapSelected,
          ]}
        >
          <MaterialCommunityIcons
            name={clinic.isFavorite ? "heart" : "medical-bag"}
            size={20}
            color={
              clinic.isFavorite
                ? "#E11D48"
                : selected
                ? "#fff"
                : palette.teal
            }
          />
        </View>
      </View>

      <View style={styles.clinicCardBody}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.clinicName} numberOfLines={1}>
            {clinic.name}
          </Text>
          <TouchableOpacity onPress={onToggleFavorite} hitSlop={8} style={{ paddingLeft: 6 }}>
            <MaterialCommunityIcons
              name={clinic.isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={clinic.isFavorite ? "#E11D48" : palette.mutedLight}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.clinicAddress} numberOfLines={2}>
          {clinic.address}
        </Text>

        <View style={styles.clinicMeta}>
          <View style={styles.clinicMetaBadge}>
            <MaterialCommunityIcons name="map-marker-distance" size={11} color={palette.teal} />
            <Text style={styles.clinicMetaText}>{formatDistance(clinic.distance)}</Text>
          </View>

          {clinic.phone && (
            <TouchableOpacity
              id={`call-btn-${clinic.id}`}
              style={styles.clinicMetaBadge}
              onPress={() => Linking.openURL(`tel:${clinic.phone}`)}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="phone" size={11} color={palette.teal} />
              <Text style={[styles.clinicMetaText, { color: palette.teal }]}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <TouchableOpacity
          id={`directions-btn-${clinic.id}`}
          style={styles.directionsBtn}
          onPress={() => Linking.openURL(getDirectionsUrl(clinic.lat, clinic.lng, clinic.name))}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="navigation-variant" size={18} color={palette.teal} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

function RecommendedClinicBanner({
  clinic,
  onPress,
  onToggleFavorite,
}: {
  clinic: VetClinic;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <View style={styles.recommendedBox}>
      <View style={styles.recommendedBadgeRow}>
        <View style={styles.recommendedBadge}>
          <MaterialCommunityIcons name="star" size={12} color="#fff" />
          <Text style={styles.recommendedBadgeText}>RECOMMENDED NEAR YOU</Text>
        </View>
        <TouchableOpacity onPress={onToggleFavorite} hitSlop={8}>
          <MaterialCommunityIcons
            name={clinic.isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={clinic.isFavorite ? "#E11D48" : palette.mutedLight}
          />
        </TouchableOpacity>
      </View>

      <Pressable onPress={onPress} style={{ gap: 4 }}>
        <Text style={styles.recommendedName} numberOfLines={1}>
          {clinic.name}
        </Text>
        <Text style={styles.recommendedAddress} numberOfLines={1}>
          {clinic.address}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <View style={styles.clinicMetaBadge}>
            <MaterialCommunityIcons name="map-marker-distance" size={11} color={palette.teal} />
            <Text style={styles.clinicMetaText}>{formatDistance(clinic.distance)} away</Text>
          </View>
          <TouchableOpacity
            style={styles.recommendedDirectionsBtn}
            onPress={() => Linking.openURL(getDirectionsUrl(clinic.lat, clinic.lng, clinic.name))}
          >
            <MaterialCommunityIcons name="navigation-variant" size={13} color="#fff" />
            <Text style={styles.recommendedDirectionsText}>Directions</Text>
          </TouchableOpacity>
          {clinic.phone && (
            <TouchableOpacity
              style={[styles.recommendedDirectionsBtn, { backgroundColor: palette.softTeal }]}
              onPress={() => Linking.openURL(`tel:${clinic.phone}`)}
            >
              <MaterialCommunityIcons name="phone" size={13} color={palette.teal} />
              <Text style={[styles.recommendedDirectionsText, { color: palette.teal }]}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveLayout();
  const { isTablet, isTiny, height, width } = responsive;

  // Dynamic panel sizing
  const panelHeight = Math.min(480, Math.max(340, height * 0.55));
  const peekHeight = isTiny ? 180 : 210;
  const panelExpandedOffset = -(panelHeight - peekHeight);

  const [permissionStatus, setPermissionStatus] = useState<"undetermined" | "granted" | "denied">("undetermined");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const panelY = useRef(new Animated.Value(0)).current;
  const [panelExpanded, setPanelExpanded] = useState(false);

  const togglePanel = useCallback(() => {
    const toValue = panelExpanded ? 0 : 1;
    Animated.spring(panelY, { toValue, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    setPanelExpanded((v) => !v);
  }, [panelExpanded, panelY]);

  const init = useCallback(async () => {
    setError(null);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      setPermissionStatus(status === "granted" ? "granted" : "denied");
      if (status !== "granted") return;

      setLoading(true);
      const loc = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = loc.coords;
      setUserLocation({ lat, lng });

      const results = await fetchNearbyVetClinics(lat, lng, SEARCH_RADIUS_M);
      setClinics(results);
    } catch (e: any) {
      setError(e?.message ?? "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  const handleToggleFavorite = async (clinic: VetClinic) => {
    const updatedFavIds = await toggleFavoriteClinicId(clinic.id);
    setClinics((prev) =>
      prev.map((c) =>
        c.id === clinic.id ? { ...c, isFavorite: updatedFavIds.includes(c.id) } : c
      )
    );
  };

  const handleViewVetsNearLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lng } = loc.coords;
      setUserLocation({ lat, lng });
      const results = await fetchNearbyVetClinics(lat, lng, SEARCH_RADIUS_M);
      setClinics(results);
      setFilter("all");
      setSearchQuery("");
    } catch (e: any) {
      Alert.alert("Location Error", "Could not refresh your current GPS location.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredClinics = useMemo(() => {
    return clinics
      .filter((c) => {
        if (filter === "favorites") return c.isFavorite;
        if (filter === "1km") return c.distance <= 1;
        if (filter === "5km") return c.distance <= 5;
        return true;
      })
      .filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
      });
  }, [clinics, filter, searchQuery]);

  const topRecommendation = useMemo(() => {
    if (filteredClinics.length === 0) return null;
    const fav = filteredClinics.find((c) => c.isFavorite);
    return fav || filteredClinics[0];
  }, [filteredClinics]);

  const handleClinicSelect = useCallback((clinic: VetClinic) => {
    setSelectedId(clinic.id);
    if (!isTablet && panelExpanded) {
      Animated.spring(panelY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
      setPanelExpanded(false);
    }
  }, [isTablet, panelExpanded, panelY]);

  const panelTranslateY = panelY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, panelExpandedOffset],
  });

  const sidebarWidth = Math.min(420, Math.max(340, width * 0.35));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isTiny && { paddingHorizontal: 12 }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Find a Vet
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {loading
              ? "Searching nearby…"
              : clinics.length > 0
              ? `${filteredClinics.length} clinic${filteredClinics.length !== 1 ? "s" : ""} found`
              : permissionStatus === "denied"
              ? "Location access required"
              : "Ready to search"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <TouchableOpacity
            id="view-near-me-btn"
            style={[styles.markClinicBtn, { backgroundColor: palette.teal }]}
            onPress={handleViewVetsNearLocation}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#fff" />
            <Text style={styles.markClinicBtnText}>{isTiny ? "Near Me" : "Vets Near Me"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {permissionStatus === "denied" ? (
        <PermissionDeniedView onRetry={init} />
      ) : error ? (
        <ErrorView message={error} onRetry={init} />
      ) : permissionStatus === "undetermined" || (permissionStatus === "granted" && !userLocation && loading) ? (
        <LoadingView />
      ) : isTablet ? (
        /* Tablet & Desktop Side-by-Side 2-Column Responsive Layout */
        <View style={styles.tabletContainer}>
          <View style={[styles.tabletSidebar, { width: sidebarWidth }]}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>
                {filteredClinics.length === 0 && !loading
                  ? "No clinics found"
                  : `${filteredClinics.length} Vet Clinic${filteredClinics.length !== 1 ? "s" : ""} Nearby`}
              </Text>
            </View>

            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={18} color={palette.muted} style={{ marginRight: 6 }} />
              <TextInput
                id="clinic-search-input-tablet"
                style={styles.searchInput}
                placeholder="Search clinics…"
                placeholderTextColor={palette.mutedLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={palette.mutedLight} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={styles.filterRow}
            >
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  id={`filter-${f.key}-btn-tablet`}
                  style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      filter === f.key && styles.filterPillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              style={styles.clinicList}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.listLoading}>
                  <ActivityIndicator size="small" color={palette.teal} />
                  <Text style={styles.listLoadingText}>Fetching nearby vet clinics…</Text>
                </View>
              ) : filteredClinics.length === 0 ? (
                <View style={styles.emptyList}>
                  <MaterialCommunityIcons name="map-search" size={36} color={palette.mutedLight} />
                  <Text style={styles.emptyListText}>
                    {searchQuery
                      ? "No clinics match your search"
                      : filter === "favorites"
                      ? "No favorite clinics added yet"
                      : filter !== "all"
                      ? "No clinics within that distance"
                      : "No vet clinics found in this area"}
                  </Text>
                </View>
              ) : (
                <>
                  {topRecommendation && (
                    <RecommendedClinicBanner
                      clinic={topRecommendation}
                      onPress={() => handleClinicSelect(topRecommendation)}
                      onToggleFavorite={() => handleToggleFavorite(topRecommendation)}
                    />
                  )}
                  {filteredClinics.map((clinic) => (
                    <ClinicCard
                      key={clinic.id}
                      clinic={clinic}
                      selected={selectedId === clinic.id}
                      onPress={() => handleClinicSelect(clinic)}
                      onToggleFavorite={() => handleToggleFavorite(clinic)}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </View>

          <View style={styles.tabletMapWrapper}>
            <VetMap
              userLocation={userLocation}
              clinics={filteredClinics}
              selectedId={selectedId}
              onSelectClinic={handleClinicSelect}
              onToggleFavorite={handleToggleFavorite}
              loading={loading}
            />
          </View>
        </View>
      ) : (
        /* Mobile Layout with Bottom Sheet */
        <View style={styles.mapContainer}>
          <VetMap
            userLocation={userLocation}
            clinics={filteredClinics}
            selectedId={selectedId}
            onSelectClinic={handleClinicSelect}
            onToggleFavorite={handleToggleFavorite}
            loading={loading}
          />

          <Animated.View
            style={[
              styles.panel,
              {
                height: panelHeight,
                bottom: insets.bottom + 0,
                transform: [{ translateY: panelTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              id="panel-toggle-btn"
              style={styles.panelHandle}
              onPress={togglePanel}
              activeOpacity={0.7}
            >
              <View style={styles.panelDrag} />
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>
                  {filteredClinics.length === 0 && !loading
                    ? "No clinics found"
                    : `${filteredClinics.length} Vet Clinic${filteredClinics.length !== 1 ? "s" : ""} Nearby`}
                </Text>
                <MaterialCommunityIcons
                  name={panelExpanded ? "chevron-down" : "chevron-up"}
                  size={20}
                  color={palette.muted}
                />
              </View>

              <View style={styles.searchRow}>
                <MaterialCommunityIcons name="magnify" size={18} color={palette.muted} style={{ marginRight: 6 }} />
                <TextInput
                  id="clinic-search-input"
                  style={styles.searchInput}
                  placeholder="Search clinics…"
                  placeholderTextColor={palette.mutedLight}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={palette.mutedLight} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, flexShrink: 0 }}
                contentContainerStyle={styles.filterRow}
              >
                {FILTERS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    id={`filter-${f.key}-btn`}
                    style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        filter === f.key && styles.filterPillTextActive,
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>

            <ScrollView
              style={styles.clinicList}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.listLoading}>
                  <ActivityIndicator size="small" color={palette.teal} />
                  <Text style={styles.listLoadingText}>Fetching nearby vet clinics…</Text>
                </View>
              ) : filteredClinics.length === 0 ? (
                <View style={styles.emptyList}>
                  <MaterialCommunityIcons name="map-search" size={36} color={palette.mutedLight} />
                  <Text style={styles.emptyListText}>
                    {searchQuery
                      ? "No clinics match your search"
                      : filter === "favorites"
                      ? "No favorite clinics added yet"
                      : filter !== "all"
                      ? "No clinics within that distance"
                      : "No vet clinics found in this area"}
                  </Text>
                </View>
              ) : (
                <>
                  {topRecommendation && (
                    <RecommendedClinicBanner
                      clinic={topRecommendation}
                      onPress={() => handleClinicSelect(topRecommendation)}
                      onToggleFavorite={() => handleToggleFavorite(topRecommendation)}
                    />
                  )}
                  {filteredClinics.map((clinic) => (
                    <ClinicCard
                      key={clinic.id}
                      clinic={clinic}
                      selected={selectedId === clinic.id}
                      onPress={() => handleClinicSelect(clinic)}
                      onToggleFavorite={() => handleToggleFavorite(clinic)}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    ...shadow.xs,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: typeScale.title,
    color: palette.text,
  },
  headerSub: {
    fontFamily: fontFamily.regular,
    fontSize: typeScale.caption,
    color: palette.muted,
    marginTop: 2,
  },
  markClinicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: palette.teal,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    ...shadow.xs,
  },
  markClinicBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: typeScale.caption,
    color: "#fff",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  tabletContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: palette.background,
  },
  tabletSidebar: {
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: palette.borderLight,
    paddingTop: 12,
    ...shadow.sm,
  },
  tabletMapWrapper: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    ...shadow.lg,
    overflow: "hidden",
  },
  panelHandle: {
    paddingBottom: 4,
  },
  panelDrag: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderLight,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: 10,
  },
  panelTitle: {
    fontFamily: fontFamily.bold,
    fontSize: typeScale.titleSmall,
    color: palette.text,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    backgroundColor: palette.background,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: typeScale.body,
    color: palette.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterPillActive: {
    backgroundColor: palette.teal,
    borderColor: palette.teal,
  },
  filterPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: typeScale.label,
    color: palette.muted,
  },
  filterPillTextActive: {
    color: "#fff",
  },
  clinicList: {
    flex: 1,
  },
  listLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },
  listLoadingText: {
    fontFamily: fontFamily.medium,
    fontSize: typeScale.body,
    color: palette.muted,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyListText: {
    fontFamily: fontFamily.medium,
    fontSize: typeScale.body,
    color: palette.muted,
    textAlign: "center",
  },
  clinicCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.borderLight,
    backgroundColor: "#fff",
  },
  clinicCardSelected: {
    backgroundColor: palette.softTeal,
  },
  clinicCardLeft: {
    flexShrink: 0,
  },
  clinicIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: palette.softTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  clinicIconWrapSelected: {
    backgroundColor: palette.teal,
  },
  clinicCardBody: {
    flex: 1,
    minWidth: 0,
  },
  clinicName: {
    fontFamily: fontFamily.semiBold,
    fontSize: typeScale.bodySmall,
    color: palette.text,
    marginBottom: 2,
  },
  clinicAddress: {
    fontFamily: fontFamily.regular,
    fontSize: typeScale.caption,
    color: palette.muted,
    lineHeight: 16,
    marginBottom: 6,
  },
  clinicMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  clinicMetaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: palette.softTeal,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  clinicMetaText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: palette.teal,
  },
  directionsBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: palette.softTeal,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    backgroundColor: palette.background,
    gap: 12,
  },
  stateIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: palette.softTeal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stateTitle: {
    fontFamily: fontFamily.bold,
    fontSize: typeScale.title,
    color: palette.text,
    textAlign: "center",
  },
  stateBody: {
    fontFamily: fontFamily.regular,
    fontSize: typeScale.body,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: palette.teal,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: radii.pill,
    ...shadow.sm,
  },
  retryBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: typeScale.action,
    color: "#fff",
  },
  loadingDot: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.softTeal,
    marginBottom: 8,
  },

  // Recommended clinic banner
  recommendedBox: {
    marginHorizontal: spacing.xl,
    marginTop: 8,
    marginBottom: 12,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.softTeal,
    borderWidth: 1,
    borderColor: palette.mintLight,
    gap: 6,
    ...shadow.xs,
  },
  recommendedBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  recommendedBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.5,
  },
  recommendedName: {
    fontFamily: fontFamily.bold,
    fontSize: typeScale.bodySmall,
    color: palette.text,
  },
  recommendedAddress: {
    fontFamily: fontFamily.regular,
    fontSize: typeScale.caption,
    color: palette.muted,
  },
  recommendedDirectionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.teal,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  recommendedDirectionsText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: "#fff",
  },
});
