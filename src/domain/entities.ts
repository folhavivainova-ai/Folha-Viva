/**
 * Domínio Canônico da Plataforma de Monitoramento Agrícola Inteligente
 * Definido em conformidade com o Manual Mestre (Seção 9 e Volume 01-E02).
 */

export type CropType = 'coffee' | 'pasture';
export type ActivityProfile = 'coffee' | 'pasture' | 'mixed';
export type CoffeeSubtype = 'clonal' | 'convencional';
export type ConfidenceLevel = 'high' | 'moderate' | 'low';
export type SeverityLevel = 'info' | 'attention' | 'high';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'false_positive';

export type FieldEventType =
  | 'irrigation'
  | 'pasture_cut'
  | 'grazing_in'
  | 'grazing_out'
  | 'inspection'
  | 'occurrence'
  | 'note'
  | 'flowering_observed';

export interface GeoPoint {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][]; // [lat, lng][]
}

export interface ProducerProfile {
  id: string;
  deviceSessionId: string;
  displayName: string;
  createdAt: string;
}

export interface Property {
  id: string;
  producerId: string;
  name: string;
  activityProfile: ActivityProfile;
  centroid?: GeoPoint;
  boundary?: GeoPolygon;
  createdAt: string;
  updatedAt: string;
}

export interface Plot {
  id: string;
  propertyId: string;
  name: string;
  geometry: GeoPolygon;
  areaHa: number;
  active: boolean;
  createdAt: string;
  cropCycle?: CropCycle;
}

export interface CropCycle {
  id: string;
  plotId: string;
  cropType: CropType;
  subtype?: CoffeeSubtype | string;
  cultivar?: string;
  startDate: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export interface FieldEvent {
  id: string;
  plotId: string;
  clientGeneratedId?: string;
  type: FieldEventType;
  occurredAt: string;
  geometry?: GeoPoint;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface WeatherDataPoint {
  timestamp: string;
  tempC: number;
  precipMm: number;
  humidityPct: number;
  windSpeedKmH: number;
  et0Mm: number;
  conditionText: string;
  isForecast?: boolean;
}

export interface RecommendationContract {
  summary: string;
  severity: SeverityLevel;
  confidence: ConfidenceLevel;
  evidence: string[];
  primaryAction: string;
  needsFieldConfirmation: boolean;
  freshness: string;
}

export interface PlotSummaryViewModel {
  plot: Plot;
  cropCycle?: CropCycle;
  status: 'good' | 'attention' | 'critical' | 'pending';
  statusText: string;
  lastUpdate: string;
  confidence: ConfidenceLevel;
  primaryAction: string;
  requiresAttention: boolean;
}
