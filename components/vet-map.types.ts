import { VetClinic } from "@/services/vetClinics";

export interface VetMapProps {
  userLocation: { lat: number; lng: number } | null;
  clinics: VetClinic[];
  selectedId: string | null;
  onSelectClinic: (clinic: VetClinic) => void;
  onToggleFavorite?: (clinic: VetClinic) => void;
  loading: boolean;
}
