/**
 * God's Eye View (GEV) Embed RPC Protocol & State Types
 * Derived from bilawalsidhu/gods-eye-view specifications
 */

export const GEV_AVAILABLE_STYLES = [
  'normal',
  'retro',         // CRT phosphor look
  'surveillance',  // Night vision green (NVG)
  'thermal',       // FLIR heat signature
  'anime',
  'noir',
  'snow',
] as const;

export type GevStyle = (typeof GEV_AVAILABLE_STYLES)[number];

export const GEV_AVAILABLE_MAPS = [
  'sentinel-2',
  'photoreal',
  'esri-imagery',
  'osm',
  'bing-aerial',
  'bing-labels',
] as const;

export type GevMap = (typeof GEV_AVAILABLE_MAPS)[number];

export const GEV_AVAILABLE_LAYERS = [
  { id: 'flights', label: 'Civilian Flights', icon: 'Plane', defaultOn: true },
  { id: 'military', label: 'Military Flights', icon: 'Crosshair', defaultOn: false },
  { id: 'ais-live-vessels', label: 'AIS Live Vessels', icon: 'Ship', defaultOn: true },
  { id: 'satellites', label: 'Satellites (NORAD)', icon: 'Satellite', defaultOn: true },
  { id: 'earthquakes', label: 'Earthquakes (USGS)', icon: 'Activity', defaultOn: true },
  { id: 'local-firms', label: 'FIRMS Thermal Fires', icon: 'Flame', defaultOn: false },
  { id: 'military-installations', label: 'Military Bases', icon: 'Shield', defaultOn: false },
  { id: 'telegeography-submarine-cables', label: 'Submarine Cables', icon: 'Layers', defaultOn: false },
  { id: 'radio', label: 'Live Radio Feeds', icon: 'Radio', defaultOn: false },
  { id: 'cctv', label: 'Public Webcams / CCTV', icon: 'Video', defaultOn: false },
  { id: 'weather-cyclones', label: 'Severe Cyclones', icon: 'Radar', defaultOn: false },
] as const;

export type GevLayerId = (typeof GEV_AVAILABLE_LAYERS)[number]['id'];

export const GEV_ANNOTATION_TYPES = [
  'pin',
  'highlight',
  'area',
  'arrow',
  'route',
  'label',
] as const;

export type GevAnnotationType = (typeof GEV_ANNOTATION_TYPES)[number];

export const GEV_ANNOTATION_COLORS = [
  'primary',
  'amber',
  'cyan',
  'green',
  'red',
] as const;

export type GevAnnotationColor = (typeof GEV_ANNOTATION_COLORS)[number];

export interface GevCamera {
  lat: number;
  lon: number;
  altitude_m?: number;
  heading_deg?: number;
  pitch_deg?: number;
}

export interface GevFollow {
  kind: 'aircraft' | 'military_aircraft' | 'satellite';
  id: string;
  cockpit?: boolean;
}

export interface GevAnnotation {
  type: GevAnnotationType;
  latitude?: number;
  longitude?: number;
  toLatitude?: number;
  toLongitude?: number;
  label?: string;
  color?: GevAnnotationColor;
  target?: string;
  points?: Array<{ latitude: number; longitude: number }>;
}

export interface GevView {
  camera: GevCamera;
  layers?: string[];
  style?: GevStyle | null;
  map?: GevMap | null;
  follow?: GevFollow | null;
  annotations?: GevAnnotation[];
}

export interface GevViewMessage {
  type: 'gev:view';
  id: string;
  view: GevView;
}

export interface GevAppliedStep {
  step: string;
  ok: boolean;
  error?: string;
}

export interface GevViewAppliedMessage {
  type: 'gev:view-applied';
  id: string | null;
  ok: boolean;
  steps?: GevAppliedStep[];
  error?: string;
}

export interface GevReadyMessage {
  type: 'gev:ready';
}

export type GevInboundMessage = GevReadyMessage | GevViewAppliedMessage;
