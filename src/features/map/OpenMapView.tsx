import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, MapPin, ZoomIn, ZoomOut } from 'lucide-react';
import { Plot, GeoPoint } from '../../domain/entities';

interface OpenMapViewProps {
  center?: [number, number];
  zoom?: number;
  plots?: Plot[];
  selectedPlotId?: string | null;
  onSelectPlot?: (plot: Plot) => void;
  isDrawingPlot?: boolean;
  drawingCropType?: 'coffee' | 'pasture';
  onPolygonCreated?: (coordinates: [number, number][], areaHa: number) => void;
  onLocationFound?: (point: GeoPoint) => void;
  className?: string;
}

// Provedores de mapa abertos conforme V03-E04 (Sem dependência de chave Google)
const MAP_LAYERS = {
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  streets: {
    name: 'Mapa Padrão',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  topo: {
    name: 'Relevo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a>',
    maxZoom: 17,
  },
};

// Cálculo geodésico aproximado de área em hectares para polígonos
export function calculatePolygonAreaHa(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let totalArea = 0;
  const radius = 6378137; // Raio da Terra em metros (WGS84)

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = (coords[i][0] * Math.PI) / 180;
    const lat2 = (coords[j][0] * Math.PI) / 180;
    const lon1 = (coords[i][1] * Math.PI) / 180;
    const lon2 = (coords[j][1] * Math.PI) / 180;

    totalArea += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  totalArea = (Math.abs(totalArea * radius * radius) / 2.0);
  const hectares = totalArea / 10000;
  return Math.round(hectares * 100) / 100;
}

export const OpenMapView: React.FC<OpenMapViewProps> = ({
  center = [-20.0, -44.0], // Padrão Brasil central/sudeste cafeeiro
  zoom = 15,
  plots = [],
  selectedPlotId = null,
  onSelectPlot,
  isDrawingPlot = false,
  drawingCropType = 'coffee',
  onPolygonCreated,
  onLocationFound,
  className = 'h-[450px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const plotsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof MAP_LAYERS>('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locationMarkerRef = useRef<L.Marker | null>(null);

  // Inicializar o Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    const activeConfig = MAP_LAYERS[activeLayerKey];
    const tileLayer = L.tileLayer(activeConfig.url, {
      attribution: activeConfig.attribution,
      maxZoom: activeConfig.maxZoom,
    }).addTo(map);

    const plotsLayerGroup = L.layerGroup().addTo(map);
    const drawingLayerGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    plotsLayerGroupRef.current = plotsLayerGroup;
    drawingLayerGroupRef.current = drawingLayerGroup;

    // Ajustar tamanho se container carregar após render
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Atualizar centro do mapa quando coordenadas mudarem (GPS ou escolha)
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    mapInstanceRef.current.setView(center, zoom || mapInstanceRef.current.getZoom());

    // Se tiver onLocationFound, atualizar o marcador de localização
    if (onLocationFound && center[0] !== -20.0 && center[1] !== -44.0) {
      if (locationMarkerRef.current) {
        locationMarkerRef.current.setLatLng(center);
      } else {
        const marker = L.marker(center, {
          icon: L.divIcon({
            className: 'custom-farm-pin',
            html: `<div style="background-color:#2F7D4A;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;">🌱</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(mapInstanceRef.current);
        marker.bindTooltip('Sede da Propriedade', { permanent: false, direction: 'top' });
        locationMarkerRef.current = marker;
      }
    }
  }, [center?.[0], center?.[1], zoom]);

  // Trocar camada de fundo (V03-E04)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = MAP_LAYERS[activeLayerKey];

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [activeLayerKey]);

  // Renderizar Talhões Cadastrados
  useEffect(() => {
    if (!plotsLayerGroupRef.current || !mapInstanceRef.current) return;
    plotsLayerGroupRef.current.clearLayers();

    if (plots.length === 0) return;

    const bounds = L.latLngBounds([]);

    plots.forEach((plot) => {
      if (!plot.geometry || !plot.geometry.coordinates || plot.geometry.coordinates.length < 3) return;

      const isCoffee = plot.cropCycle?.cropType === 'coffee';
      const isSelected = selectedPlotId === plot.id;

      const polygonColor = isCoffee ? '#2F7D4A' : '#8BCF9B';
      const fillColor = isCoffee ? '#173F2A' : '#2F7D4A';

      const poly = L.polygon(plot.geometry.coordinates, {
        color: isSelected ? '#FFFDF7' : polygonColor,
        weight: isSelected ? 3.5 : 2,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.45 : 0.25,
      });

      poly.bindTooltip(
        `<div class="text-xs font-semibold text-stone-900">${plot.name} (${plot.areaHa} ha)</div>`,
        { permanent: false, direction: 'center', className: 'rounded px-2 py-1 shadow-sm' }
      );

      poly.on('click', () => {
        if (onSelectPlot) {
          onSelectPlot(plot);
        }
      });

      plotsLayerGroupRef.current?.addLayer(poly);
      bounds.extend(poly.getBounds());
    });

    if (bounds.isValid() && !isDrawingPlot && drawingPoints.length === 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [plots, selectedPlotId, isDrawingPlot]);

  // Listener de Clique no Mapa (Desenho de Talhão ou Marcação de Sede da Fazenda)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isDrawingPlot) {
        const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        setDrawingPoints((prev) => [...prev, newPoint]);
      } else if (onLocationFound) {
        // Marca o local da fazenda ao clicar no mapa
        onLocationFound({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
          accuracyMeters: 10,
        });
      }
    };

    map.on('click', handleMapClick);

    if (!isDrawingPlot) {
      setDrawingPoints([]);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingPlot, onLocationFound]);

  // Atualizar visualização do desenho em andamento
  useEffect(() => {
    if (!drawingLayerGroupRef.current) return;
    drawingLayerGroupRef.current.clearLayers();

    if (drawingPoints.length === 0) return;

    // Marcadores dos vértices
    drawingPoints.forEach((pt, index) => {
      const circle = L.circleMarker(pt, {
        radius: 6,
        color: '#FFFFFF',
        weight: 2,
        fillColor: drawingCropType === 'coffee' ? '#2F7D4A' : '#8BCF9B',
        fillOpacity: 1,
      });
      drawingLayerGroupRef.current?.addLayer(circle);

      if (index === 0 && drawingPoints.length >= 3) {
        circle.bindTooltip('Toque aqui para fechar talhão', { permanent: true, direction: 'top' });
        circle.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleFinishDrawing();
        });
      }
    });

    // Linha conectando os pontos
    if (drawingPoints.length >= 2) {
      const polyline = L.polyline(drawingPoints, {
        color: '#D99A22',
        weight: 2.5,
        dashArray: '6, 6',
      });
      drawingLayerGroupRef.current.addLayer(polyline);
    }

    // Polígono de prévia quando tiver 3+ pontos
    if (drawingPoints.length >= 3) {
      const previewPoly = L.polygon(drawingPoints, {
        color: '#2F7D4A',
        weight: 2,
        fillColor: '#8BCF9B',
        fillOpacity: 0.2,
      });
      drawingLayerGroupRef.current.addLayer(previewPoly);
    }
  }, [drawingPoints, drawingCropType]);

  const handleFinishDrawing = () => {
    if (drawingPoints.length < 3) return;
    const area = calculatePolygonAreaHa(drawingPoints);
    if (onPolygonCreated) {
      onPolygonCreated(drawingPoints, area);
    }
    setDrawingPoints([]);
  };

  const handleClearDrawing = () => {
    setDrawingPoints([]);
  };

  // V03-E05: Minha posição no campo com GPS do dispositivo
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada no seu navegador.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);

          const userMarker = L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#FFFFFF',
            weight: 2,
            fillColor: '#2F7D4A',
            fillOpacity: 1,
          }).bindPopup(`Sua posição em campo (Precisão: ±${Math.round(accuracy)}m)`).openPopup();

          const accuracyCircle = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#2F7D4A',
            weight: 1,
            fillColor: '#8BCF9B',
            fillOpacity: 0.15,
          });

          plotsLayerGroupRef.current?.addLayer(userMarker);
          plotsLayerGroupRef.current?.addLayer(accuracyCircle);
        }

        if (onLocationFound) {
          onLocationFound({
            lat: latitude,
            lng: longitude,
            accuracyMeters: accuracy,
          });
        }
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Não foi possível obter sua localização.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permissão de GPS negada. Você pode escolher a posição no mapa.';
        }
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const currentArea = drawingPoints.length >= 3 ? calculatePolygonAreaHa(drawingPoints) : 0;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-[#D8C4A8]/40 shadow-sm ${className}`}>
      {/* Container Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controles de Mapa Flutuantes */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Botão de Camadas (V03-E04) */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-10 h-10 rounded-xl bg-white/95 text-[#173F2A] shadow-md border border-[#D8C4A8]/60 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
            title="Trocar camada de mapa"
          >
            <Layers className="w-5 h-5 text-[#2F7D4A]" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 top-12 w-44 rounded-xl bg-white p-2 shadow-xl border border-[#D8C4A8] text-xs space-y-1 z-30">
              <div className="font-semibold text-[#173F2A] px-2 py-1 border-b border-stone-100">
                Camadas Abertas
              </div>
              {Object.entries(MAP_LAYERS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveLayerKey(key as keyof typeof MAP_LAYERS);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                    activeLayerKey === key
                      ? 'bg-[#8BCF9B]/25 text-[#173F2A] font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{config.name}</span>
                  {activeLayerKey === key && <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D4A]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão "Onde estou" (V03-E05) */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-10 h-10 rounded-xl bg-white/95 text-[#173F2A] shadow-md border border-[#D8C4A8]/60 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer disabled:opacity-50"
          title="Minha posição no campo (GPS)"
        >
          <Crosshair className={`w-5 h-5 ${isLocating ? 'text-[#D99A22] animate-spin' : 'text-[#2F7D4A]'}`} />
        </button>

        {/* Zoom */}
        <div className="flex flex-col rounded-xl bg-white/95 shadow-md border border-[#D8C4A8]/60 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 border-b border-stone-200 transition cursor-pointer"
            title="Aproximar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-9 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition cursor-pointer"
            title="Afastar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de Instrução de Desenho Ativo */}
      {isDrawingPlot && (
        <div className="absolute top-3 left-3 right-16 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-[#2F7D4A]/40 shadow-lg text-xs text-[#173F2A] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D4A] animate-pulse" />
            <div>
              <p className="font-semibold">
                Toque no mapa para marcar os vértices ({drawingPoints.length} pontos)
              </p>
              {currentArea > 0 && (
                <p className="text-[#6B4A35]">
                  Área estimada: <strong>{currentArea} ha</strong>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {drawingPoints.length > 0 && (
              <button
                onClick={handleClearDrawing}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              onClick={handleFinishDrawing}
              disabled={drawingPoints.length < 3}
              className="px-3 py-1.5 rounded-lg bg-[#2F7D4A] text-white hover:bg-[#173F2A] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Concluir Talhão
            </button>
          </div>
        </div>
      )}

      {/* Erro de GPS discreto */}
      {locationError && (
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-xs text-amber-900 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            onClick={() => setLocationError(null)}
            className="text-stone-500 font-bold hover:text-stone-800 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Legenda de Satélite e Qualidade (V04-E04) */}
      <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
        <span className="px-2 py-0.5 rounded bg-black/60 text-white text-[10px] backdrop-blur-xs font-mono">
          Sentinel / Esri Open Tiles
        </span>
      </div>
    </div>
  );
};
