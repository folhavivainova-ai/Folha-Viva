export interface MapLayer { name: string; url: string; attribution: string; maxZoom: number }
export interface MapProvider { layers: Record<'satellite' | 'streets' | 'topo', MapLayer> }
export const openMapProvider: MapProvider = {
  layers: {
    satellite: { name: 'Satélite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri and contributors', maxZoom: 18 },
    streets: { name: 'Mapa Padrão', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 },
    topo: { name: 'Relevo', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap, SRTM, OpenTopoMap', maxZoom: 17 },
  },
};
