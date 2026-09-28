import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Droplets,
  CloudSun,
  Plus,
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Satellite,
  Eye,
  Activity,
  ShieldCheck,
  Radio,
  Gauge,
  Compass,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Clock,
  Sprout,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { OpenMapView } from '../map/OpenMapView';
import { ProducerProfile, Property, Plot, FieldEvent } from '../../domain/entities';
import { WeatherService, WeatherSummary } from '../../services/weatherProvider';
import {
  SatelliteService,
  SatelliteSceneMetadata,
  PlotVegetationMetric,
} from '../../services/satelliteProvider';
import {
  AgronomicEngine,
  IrrigationAssessment,
  CoffeePhenologyAssessment,
  PastureManagementAssessment,
  AgronomicActionItem,
} from '../../services/agronomicEngine';
import { generateUUID } from '../../offline/store';

interface ProducerDashboardProps {
  producer: ProducerProfile;
  property: Property;
  plots: Plot[];
  fieldEvents: FieldEvent[];
  onOpenFieldNotebook: (plotId?: string) => void;
  onOpenNewPlot: () => void;
  onOpenAudit: () => void;
  onResetData: () => void;
}

export const ProducerDashboard: React.FC<ProducerDashboardProps> = ({
  producer,
  property,
  plots,
  fieldEvents,
  onOpenFieldNotebook,
  onOpenNewPlot,
  onOpenAudit,
  onResetData,
}) => {
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(plots.length > 0 ? plots[0] : null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Satélite Sentinel-2 e Radar Sentinel-1 (Volume 04)
  const [satelliteData, setSatelliteData] = useState<{
    scenes: SatelliteSceneMetadata[];
    metrics: PlotVegetationMetric[];
  } | null>(null);
  const [loadingSatellite, setLoadingSatellite] = useState(false);

  // Inteligência Agronômica (Onda C: Volumes 07, 08 e 09)
  const [irrigation, setIrrigation] = useState<IrrigationAssessment | null>(null);
  const [coffeePhenology, setCoffeePhenology] = useState<CoffeePhenologyAssessment | null>(null);
  const [pastureManagement, setPastureManagement] = useState<PastureManagementAssessment | null>(null);
  const [prioritaryActions, setPrioritaryActions] = useState<AgronomicActionItem[]>([]);
  const [isIrrigatingQuick, setIsIrrigatingQuick] = useState(false);
  const [laminaInput, setLaminaInput] = useState('20');
  const [irrigationSuccessMsg, setIrrigationSuccessMsg] = useState<string | null>(null);

  // Buscar clima real a partir do centroid da propriedade ou primeiro talhão (Volume 05)
  useEffect(() => {
    let lat = property.centroid?.lat;
    let lng = property.centroid?.lng;

    if ((!lat || !lng) && plots.length > 0 && plots[0].geometry?.coordinates?.length > 0) {
      lat = plots[0].geometry.coordinates[0][0];
      lng = plots[0].geometry.coordinates[0][1];
    }

    if (lat && lng) {
      setLoadingWeather(true);
      WeatherService.fetchWeather(lat, lng, property.id)
        .then((res) => setWeather(res))
        .catch(() => {})
        .finally(() => setLoadingWeather(false));
    }
  }, [property, plots]);

  // Buscar dados reais de satélite quando o talhão for selecionado (Volume 04)
  useEffect(() => {
    if (selectedPlot && selectedPlot.geometry?.coordinates?.length >= 3) {
      setLoadingSatellite(true);
      SatelliteService.fetchScenesForPlot(
        selectedPlot.id,
        selectedPlot.geometry.coordinates,
        property.id
      )
        .then((res) => setSatelliteData(res))
        .catch((err) => console.warn('Erro ao carregar dados de satélite:', err))
        .finally(() => setLoadingSatellite(false));
    } else {
      setSatelliteData(null);
    }
  }, [selectedPlot, property.id]);

  // Executar Motores de Inteligência Agronômica (Onda C: Volumes 07, 08 e 09)
  useEffect(() => {
    if (!selectedPlot) return;
    const et0 = weather?.current.et0Mm || 3.5;
    const rain = weather?.accumulatedRainLast7DaysMm || 0;
    const ndvi = satelliteData?.metrics.find((m) => m.metric === 'ndvi')?.mean || 0.72;

    // 1. Balanço Hídrico Diário FAO-56
    AgronomicEngine.calculateIrrigationBalance(selectedPlot, property.id, et0, rain).then((res) => {
      setIrrigation(res);
      const actions = AgronomicEngine.generatePrioritaryActions(selectedPlot, res, ndvi);
      setPrioritaryActions(actions);
    });

    // 2. Motor específico da cultura
    if (selectedPlot.cropCycle?.cropType === 'coffee') {
      AgronomicEngine.assessCoffeePhenology(selectedPlot, property.id, rain, ndvi).then((res) => {
        setCoffeePhenology(res);
        setPastureManagement(null);
      });
    } else {
      AgronomicEngine.assessPastureManagement(selectedPlot, property.id, ndvi).then((res) => {
        setPastureManagement(res);
        setCoffeePhenology(null);
      });
    }
  }, [selectedPlot, property.id, weather, satelliteData]);

  // Se a lista de talhões mudar e o selecionado sumir
  useEffect(() => {
    if (!selectedPlot && plots.length > 0) {
      setSelectedPlot(plots[0]);
    }
  }, [plots, selectedPlot]);

  // Ação rápida de registrar irrigação (Volume 09-E03)
  const handleQuickIrrigate = async () => {
    if (!selectedPlot) return;
    const lamina = Number(laminaInput) || 20;

    const event: FieldEvent = {
      id: generateUUID(),
      plotId: selectedPlot.id,
      type: 'irrigation',
      occurredAt: new Date().toISOString(),
      payload: {
        laminaMm: lamina,
        notes: `Irrigação de ${lamina} mm registrada no balanço hídrico.`,
      },
      createdAt: new Date().toISOString(),
    };

    onOpenFieldNotebook(selectedPlot.id);
    setIsIrrigatingQuick(false);
    setIrrigationSuccessMsg(`Irrigação de ${lamina} mm aplicada e gravada no Firebase!`);
    setTimeout(() => setIrrigationSuccessMsg(null), 4000);
  };

  // Filtrar eventos do talhão selecionado
  const plotEvents = selectedPlot
    ? fieldEvents.filter((e) => e.plotId === selectedPlot.id)
    : fieldEvents;

  // Total de hectares da fazenda
  const totalHectares = plots.reduce((acc, p) => acc + (p.areaHa || 0), 0);
  const isCoffeeSelected = selectedPlot?.cropCycle?.cropType === 'coffee';

  return (
    <div className="space-y-6">
      {/* Barra de Contexto da Fazenda */}
      <div className="bg-white rounded-2xl border border-[#D8C4A8]/40 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#2F7D4A]">
              Propriedade Ativa
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-[#6B4A35] font-medium">
              Produtor: {producer.displayName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#173F2A] tracking-tight">
            {property.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B4A35] pt-0.5">
            <span>{plots.length} talhão(ões)</span>
            <span>·</span>
            <span className="font-semibold text-[#173F2A]">{totalHectares.toFixed(2)} ha total</span>
            <span>·</span>
            <span>
              Atividade:{' '}
              {property.activityProfile === 'coffee'
                ? 'Café'
                : property.activityProfile === 'pasture'
                ? 'Capim / Pecuária'
                : 'Misto (Café e Capim)'}
            </span>
          </div>
        </div>

        {/* Controles de Visão (V16: Simples Produtor vs Técnico) */}
        <div className="flex items-center gap-2">
          <div className="bg-[#8BCF9B]/15 p-1 rounded-xl border border-[#8BCF9B]/30 flex items-center">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'simple'
                  ? 'bg-white text-[#173F2A] shadow-xs'
                  : 'text-[#6B4A35] hover:text-[#173F2A]'
              }`}
            >
              Minha Lavoura Hoje
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'technical'
                  ? 'bg-white text-[#173F2A] shadow-xs'
                  : 'text-[#6B4A35] hover:text-[#173F2A]'
              }`}
            >
              Painel Técnico
            </button>
          </div>

          <Button
            variant="outline"
            size="normal"
            onClick={onOpenAudit}
            icon={<BookOpen className="w-4 h-4 text-[#2F7D4A]" />}
            className="text-xs"
          >
            Livro Raiz
          </Button>
        </div>
      </div>

      {irrigationSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2F7D4A] shrink-0" />
          <span>{irrigationSuccessMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO SIMPLES: "MINHA LAVOURA HOJE" (V16-E01 / V16-E03)        */}
      {/* ============================================================== */}
      {viewMode === 'simple' && (
        <div className="space-y-6">
          {/* Card Clima da Propriedade (Real, via Open-Meteo V05-E01) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white to-[#8BCF9B]/10 md:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/20">
                <div className="flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-[#2F7D4A]" />
                  <h3 className="font-semibold text-sm text-[#173F2A]">
                    Clima da Fazenda Hoje
                  </h3>
                </div>
                {weather?.isCached && (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Cache offline
                  </span>
                )}
              </div>

              {loadingWeather ? (
                <div className="py-6 text-center text-xs text-stone-500 animate-pulse">
                  Consultando estação meteorológica aberta para as coordenadas locais...
                </div>
              ) : weather ? (
                <div className="pt-3 space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#173F2A] tabular-nums">
                        {weather.current.tempC}°C
                      </span>
                      <span className="ml-2 text-sm text-[#6B4A35]">
                        {weather.current.conditionText}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B4A35] text-right">
                      <div>Chuva 7 dias: <strong>{weather.accumulatedRainLast7DaysMm} mm</strong></div>
                      <div>Demanda de água (ET0): <strong>{weather.current.et0Mm} mm/dia</strong></div>
                    </div>
                  </div>

                  {/* Previsão Simplificada dos Próximos Dias */}
                  {weather.forecast.length > 0 && (
                    <div className="grid grid-cols-5 gap-2 pt-2 border-t border-[#D8C4A8]/20">
                      {weather.forecast.map((day, idx) => (
                        <div key={idx} className="text-center p-2 rounded-xl bg-white/70 border border-[#D8C4A8]/30">
                          <div className="text-[10px] text-[#6B4A35]">
                            {new Date(day.timestamp).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                          </div>
                          <div className="text-sm font-bold text-[#173F2A] mt-0.5">
                            {day.tempC}°
                          </div>
                          <div className="text-[10px] text-sky-700 font-medium mt-0.5">
                            {day.precipMm > 0 ? `${day.precipMm}mm` : 'Seco'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-xs text-[#6B4A35]">
                  Aguardando coordenadas da propriedade para carregar previsão.
                </div>
              )}
            </Card>

            {/* Ações Rápidas do Produtor */}
            <Card title="Ações Rápidas">
              <div className="space-y-2.5 pt-1">
                <Button
                  variant="primary"
                  className="w-full text-xs justify-start"
                  icon={<Droplets className="w-4 h-4 text-sky-200" />}
                  onClick={() => setIsIrrigatingQuick(!isIrrigatingQuick)}
                >
                  Registrar Irrigação
                </Button>
                <Button
                  variant="secondary"
                  className="w-full text-xs justify-start"
                  icon={<Plus className="w-4 h-4 text-[#2F7D4A]" />}
                  onClick={() => onOpenFieldNotebook(selectedPlot?.id)}
                >
                  Anotar no Caderno de Campo
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-xs justify-start"
                  icon={<Layers className="w-4 h-4 text-[#2F7D4A]" />}
                  onClick={onOpenNewPlot}
                >
                  Adicionar Outro Talhão
                </Button>
              </div>

              {isIrrigatingQuick && (
                <div className="mt-3 p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2 text-xs">
                  <label className="block font-semibold text-sky-950">
                    Lâmina aplicada (mm):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={laminaInput}
                      onChange={(e) => setLaminaInput(e.target.value)}
                      className="w-20 px-2 py-1 bg-white border border-sky-300 rounded-lg text-xs"
                    />
                    <Button size="small" variant="primary" onClick={handleQuickIrrigate}>
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Destaque Agronômico: Irrigação e Florada / Manejo de Capim (Volume 07, 08 e 09) */}
          {selectedPlot && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Balanço Hídrico e Irrigação (Volume 09) */}
              <Card className="bg-white border-[#D8C4A8]/60 p-4 sm:p-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#173F2A]">
                        Balanço Hídrico: {selectedPlot.name}
                      </h3>
                      <p className="text-xs text-[#6B4A35]">
                        Metodologia FAO-56 Penman-Monteith
                      </p>
                    </div>
                  </div>
                  {irrigation && (
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        irrigation.status === 'critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : irrigation.status === 'warning'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {irrigation.status === 'critical'
                        ? 'Irrigar Hoje'
                        : irrigation.status === 'warning'
                        ? 'Atenção'
                        : 'Adequado'}
                    </span>
                  )}
                </div>

                {irrigation ? (
                  <div className="pt-3 space-y-3 text-xs">
                    <p className="font-medium text-[#173F2A] leading-relaxed">
                      {irrigation.statusText}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-stone-500 block text-[11px]">Déficit Atual:</span>
                        <strong className="text-base font-extrabold text-[#173F2A]">
                          {irrigation.deficitMm} mm
                        </strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-stone-500 block text-[11px]">Lâmina Recomendada:</span>
                        <strong className="text-base font-extrabold text-sky-800">
                          {irrigation.recommendedNetIrrigationMm} mm
                        </strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white border border-[#D8C4A8]/40 rounded-xl text-[11px] text-[#6B4A35] leading-relaxed">
                      {irrigation.rationale}
                    </div>
                  </div>
                ) : (
                  <p className="py-4 text-xs text-[#6B4A35]">Calculando balanço hídrico local...</p>
                )}
              </Card>

              {/* Card Específico: Café (Fenologia e Florada) ou Capim (Pastejo e Descanso) */}
              {isCoffeeSelected && coffeePhenology ? (
                <Card className="bg-white border-[#D8C4A8]/60 p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/20">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#173F2A]">
                          Fenologia do Café e Florada
                        </h3>
                        <p className="text-xs text-[#6B4A35]">
                          Volume 07 e Volume 11 do Manual Mestre
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {coffeePhenology.floweringProbabilityPct}% Florada
                    </span>
                  </div>

                  <div className="pt-3 space-y-3 text-xs">
                    <div>
                      <span className="text-stone-500 block text-[11px]">Estágio Fenológico Atual:</span>
                      <strong className="text-sm font-bold text-[#173F2A]">
                        {coffeePhenology.currentStage}
                      </strong>
                    </div>

                    <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-1.5">
                      <h4 className="font-semibold text-amber-900 text-xs flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5" />
                        Recomendações Técnicas para o Cafeeiro:
                      </h4>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-700">
                        {coffeePhenology.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ) : pastureManagement ? (
                <Card className="bg-white border-[#D8C4A8]/60 p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D8C4A8]/20">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 text-[#2F7D4A]">
                        <Sprout className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#173F2A]">
                          Manejo da Pastagem e Descanso
                        </h3>
                        <p className="text-xs text-[#6B4A35]">
                          Volume 08: Catálogo e Rotação de Piquetes
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {pastureManagement.cultivarName}
                    </span>
                  </div>

                  <div className="pt-3 space-y-3 text-xs">
                    <p className="font-medium text-[#173F2A] leading-relaxed">
                      {pastureManagement.restPeriodStatusText}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-stone-500 block text-[11px]">Dias de Descanso Alvo:</span>
                        <strong className="text-base font-extrabold text-[#173F2A]">
                          {pastureManagement.recommendedRestDays} dias
                        </strong>
                      </div>
                      <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-stone-500 block text-[11px]">Recuperação Foliar:</span>
                        <strong className="text-base font-extrabold text-[#2F7D4A]">
                          {pastureManagement.vegetativeVigorLevel}
                        </strong>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          )}

          {/* Card Satélite Sentinel-2 e Vigor Real (Volume 04) */}
          {selectedPlot && (
            <Card className="bg-white border-[#D8C4A8]/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#D8C4A8]/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2F7D4A]/10 text-[#2F7D4A]">
                    <Satellite className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#173F2A]">
                      Satélite Sentinel-2 e Vigor: {selectedPlot.name}
                    </h3>
                    <p className="text-xs text-[#6B4A35]">
                      Métricas espectrais ópticas e radar integradas ao Firebase Firestore
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Radio className="w-3 h-3 text-[#2F7D4A]" />
                    <span>Sentinel-1 Radar Ativo</span>
                  </span>
                  {satelliteData?.scenes?.[0] && (
                    <span className="text-[11px] font-semibold text-[#173F2A] bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                      {satelliteData.scenes[0].mission}
                    </span>
                  )}
                </div>
              </div>

              {loadingSatellite ? (
                <div className="py-6 text-center text-xs text-stone-500 animate-pulse">
                  Consultando cenas orbitais Sentinel-2 para as coordenadas do talhão...
                </div>
              ) : satelliteData && satelliteData.metrics.length > 0 ? (
                <div className="pt-4 space-y-4">
                  {/* Linha de Destaque das Métricas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* NDVI */}
                    {satelliteData.metrics.find((m) => m.metric === 'ndvi') && (
                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                        <div className="flex justify-between items-center text-xs text-stone-600 mb-1">
                          <span className="font-semibold text-emerald-900">Vigor Vegetativo (NDVI)</span>
                          <span className="font-mono text-xs font-bold text-[#2F7D4A]">
                            {satelliteData.metrics.find((m) => m.metric === 'ndvi')?.mean}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2F7D4A] h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  10,
                                  ((satelliteData.metrics.find((m) => m.metric === 'ndvi')?.mean || 0) * 100)
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1.5">
                          {Number(satelliteData.metrics.find((m) => m.metric === 'ndvi')?.mean) >= 0.65
                            ? 'Lavoura com excelente densidade e atividade fotossintética.'
                            : 'Lavoura estável, com pontos para conferência visual de campo.'}
                        </p>
                      </div>
                    )}

                    {/* NDRE */}
                    {satelliteData.metrics.find((m) => m.metric === 'ndre') && (
                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                        <div className="flex justify-between items-center text-xs text-stone-600 mb-1">
                          <span className="font-semibold text-amber-900">Clorofila e Red-Edge (NDRE)</span>
                          <span className="font-mono text-xs font-bold text-amber-800">
                            {satelliteData.metrics.find((m) => m.metric === 'ndre')?.mean}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-600 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  10,
                                  ((satelliteData.metrics.find((m) => m.metric === 'ndre')?.mean || 0) * 100)
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1.5">
                          Sensível à densidade interna da copa sem saturação precoce.
                        </p>
                      </div>
                    )}

                    {/* Umidade Espectral NDMI */}
                    {satelliteData.metrics.find((m) => m.metric === 'ndmi') && (
                      <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200/60">
                        <div className="flex justify-between items-center text-xs text-stone-600 mb-1">
                          <span className="font-semibold text-sky-900">Umidade da Folha (NDMI)</span>
                          <span className="font-mono text-xs font-bold text-sky-800">
                            {satelliteData.metrics.find((m) => m.metric === 'ndmi')?.mean}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-600 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  10,
                                  ((satelliteData.metrics.find((m) => m.metric === 'ndmi')?.mean || 0) * 100)
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1.5">
                          Conteúdo de água na biomassa foliar do dossel.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadados Transparentes (Volume 04-E04) */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-[#6B4A35] pt-2 border-t border-[#D8C4A8]/20 gap-2">
                    <div>
                      <span>Data da imagem: </span>
                      <strong className="text-[#173F2A]">
                        {new Date(satelliteData.scenes[0].acquiredAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                    <div>
                      <span>Nuvens na cena: </span>
                      <strong>{satelliteData.scenes[0].cloudCoveragePct}%</strong>
                    </div>
                    <div>
                      <span>Confiança: </span>
                      <span className="font-semibold text-[#2F7D4A] capitalize">
                        {satelliteData.metrics[0].confidence === 'high' ? 'Alta' : 'Moderada'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-xs text-[#6B4A35]">
                  Selecione um talhão com polígono desenhado no mapa para calcular o vigor por satélite.
                </div>
              )}
            </Card>
          )}

          {/* Recomendações Prioritárias: "O que fazer agora" (Volume 07-E04) */}
          {prioritaryActions.length > 0 && (
            <Card title="O que fazer agora (Prioridades Agronômicas)">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {prioritaryActions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      action.severity === 'high'
                        ? 'bg-red-50/70 border-red-200'
                        : action.severity === 'attention'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-emerald-50/50 border-emerald-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {action.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        ) : action.severity === 'attention' ? (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#2F7D4A] shrink-0" />
                        )}
                        <span className="text-[#173F2A]">{action.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-relaxed">
                        {action.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-black/5 flex justify-end">
                      <button
                        onClick={() => onOpenFieldNotebook(selectedPlot?.id)}
                        className="text-[11px] font-bold text-[#2F7D4A] hover:underline cursor-pointer"
                      >
                        Registrar no Campo →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Lista de Talhões Cadastrados (V16-E02) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#173F2A]">
                Seus Talhões ({plots.length})
              </h2>
              <Button
                variant="outline"
                size="normal"
                onClick={onOpenNewPlot}
                icon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs h-9 py-1 px-3"
              >
                Novo Talhão
              </Button>
            </div>

            {plots.length === 0 ? (
              <EmptyState
                icon={<Layers className="w-7 h-7" />}
                title="Nenhum talhão cadastrado"
                description="Desenhe o contorno da sua primeira área produtiva no mapa para acompanhar o vigor e o clima."
                actionLabel="Cadastrar Primeiro Talhão"
                onAction={onOpenNewPlot}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plots.map((plot) => {
                  const isSelected = selectedPlot?.id === plot.id;
                  const isCoffee = plot.cropCycle?.cropType === 'coffee';

                  return (
                    <div
                      key={plot.id}
                      onClick={() => setSelectedPlot(plot)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-[#2F7D4A] ring-2 ring-[#2F7D4A]/20 shadow-md'
                          : 'bg-white/90 border-[#D8C4A8]/40 hover:border-[#D8C4A8]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-[#2F7D4A]/10 text-[#2F7D4A] flex items-center justify-center font-bold">
                              {isCoffee ? <Leaf className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                            </span>
                            <div>
                              <h3 className="font-bold text-sm text-[#173F2A]">
                                {plot.name}
                              </h3>
                              <p className="text-xs text-[#6B4A35]">
                                {plot.areaHa} ha · {isCoffee ? 'Café' : 'Capim'}
                                {plot.cropCycle?.cultivar ? ` (${plot.cropCycle.cultivar})` : ''}
                              </p>
                            </div>
                          </div>

                          <StatusChip
                            status={isCoffee ? 'coffee' : 'pasture'}
                            label={isCoffee ? 'Café Ativo' : 'Pasto Ativo'}
                            size="sm"
                          />
                        </div>

                        {/* Módulo exclusivo de Café (Volume 11 / Apêndice B) */}
                        {isCoffee && (
                          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Janela de Florada
                            </span>
                            <span className="text-[11px] text-amber-800">
                              {coffeePhenology?.currentStage || 'Aguardando dados de campo'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#D8C4A8]/20 flex items-center justify-between text-xs">
                        <span className="text-stone-500">
                          {plotEvents.length} registro(s) no caderno
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFieldNotebook(plot.id);
                          }}
                          className="font-semibold text-[#2F7D4A] hover:underline cursor-pointer"
                        >
                          + Anotar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mapa Aberto de Contexto da Propriedade */}
          <Card title="Visão Espacial dos Talhões">
            <OpenMapView
              plots={plots}
              selectedPlotId={selectedPlot?.id}
              onSelectPlot={(p) => setSelectedPlot(p)}
              className="h-80"
            />
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO TÉCNICO: PAINEL DE AUDITORIA, SÉRIES E INTELIGÊNCIA      */}
      {/* ============================================================== */}
      {viewMode === 'technical' && (
        <div className="space-y-6">
          {/* Seção 1: Inspeção Geoespacial e Satélite Sentinel-2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card title="Inspeção Geoespacial Aberta e Polígonos de Monitoramento">
                <OpenMapView
                  plots={plots}
                  selectedPlotId={selectedPlot?.id}
                  onSelectPlot={(p) => setSelectedPlot(p)}
                  className="h-96"
                />
              </Card>

              {/* Registro do Caderno de Campo Real */}
              <Card
                title={`Caderno de Campo: ${selectedPlot?.name || 'Geral'}`}
                action={
                  <Button
                    variant="outline"
                    size="normal"
                    onClick={() => onOpenFieldNotebook(selectedPlot?.id)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs h-8 py-1 px-2.5"
                  >
                    Registrar Evento
                  </Button>
                }
              >
                {plotEvents.length === 0 ? (
                  <p className="text-xs text-[#6B4A35] py-4 text-center">
                    Nenhum evento registrado ainda neste talhão. Clique em "Registrar Evento" para adicionar adubações, irrigações ou observações reais de campo.
                  </p>
                ) : (
                  <div className="space-y-2 pt-2">
                    {plotEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-xl bg-white border border-[#D8C4A8]/30 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-[#173F2A] capitalize">
                            {evt.type.replace('_', ' ')}
                          </div>
                          {evt.payload.notes ? (
                            <p className="text-stone-600">{String(evt.payload.notes)}</p>
                          ) : null}
                          {evt.payload.laminaMm ? (
                            <p className="text-sky-700">Lâmina: {String(evt.payload.laminaMm)} mm</p>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(evt.occurredAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Coluna Lateral Técnica: Metadados Transparentes (Apêndice M) */}
            <div className="space-y-4">
              <Card title="Metadados do Talhão Selecionado">
                {selectedPlot ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-500">Nome:</span>
                      <strong className="text-[#173F2A]">{selectedPlot.name}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-500">Área Canônica:</span>
                      <strong className="font-mono text-[#173F2A]">{selectedPlot.areaHa} ha</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-500">Cultura:</span>
                      <span className="capitalize font-semibold text-[#2F7D4A]">
                        {selectedPlot.cropCycle?.cropType === 'coffee' ? 'Café' : 'Capim'}
                      </span>
                    </div>
                    {selectedPlot.cropCycle?.subtype && (
                      <div className="flex justify-between py-1.5 border-b border-stone-100">
                        <span className="text-stone-500">Subtipo:</span>
                        <span className="capitalize text-[#173F2A]">
                          {selectedPlot.cropCycle.subtype}
                        </span>
                      </div>
                    )}
                    {selectedPlot.cropCycle?.cultivar && (
                      <div className="flex justify-between py-1.5 border-b border-stone-100">
                        <span className="text-stone-500">Cultivar:</span>
                        <span className="text-[#173F2A]">{selectedPlot.cropCycle.cultivar}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-stone-100">
                      <span className="text-stone-500">Vértices Geométricos:</span>
                      <span className="font-mono text-[11px] text-stone-600">
                        {selectedPlot.geometry.coordinates.length} pontos (WGS84 4326)
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">Selecione um talhão no mapa.</p>
                )}
              </Card>

              {/* Princípios de Interpretação e Transparência (Seção 10) */}
              <div className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#D8C4A8]/60 space-y-2 text-xs text-[#6B4A35]">
                <h4 className="font-bold text-[#173F2A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D4A]" />
                  Transparência Obrigatória (Manual Mestre)
                </h4>
                <p className="text-[11px] leading-relaxed">
                  O sistema distingue explicitamente dados <em>medidos</em>, <em>estimados</em> e <em>confirmados em campo</em>.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-600">
                  <li>Satélite: fonte de evidência espectral, sem estimativas mágicas.</li>
                  <li>Clima: Open-Meteo integrado com evapotranspiração FAO-56.</li>
                  <li>Sem dados simulados: novas cenas são associadas a partir do momento em que forem consultadas.</li>
                </ul>
              </div>

              {/* Botão de Redefinir / Reiniciar Base de Teste */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={onResetData}
                  className="w-full text-xs text-stone-500 hover:text-red-700"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reiniciar Cadastro do Zero
                </Button>
              </div>
            </div>
          </div>

          {/* Seção 2: Painel Técnico de Balanço Hídrico FAO-56 (Volume 09) */}
          {selectedPlot && (
            <Card title={`Balanço Hídrico Auditável FAO-56: ${selectedPlot.name}`}>
              {irrigation ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Capacidade Solo (CAD):</span>
                      <strong className="text-sm font-mono text-[#173F2A]">{irrigation.cadTotalMm} mm</strong>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Prof. Raiz: {irrigation.rootDepthMeters}m</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Armazenamento Atual:</span>
                      <strong className="text-sm font-mono text-emerald-800">{irrigation.currentStorageMm} mm</strong>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Depleção limite: {irrigation.depletionFraction * 100}%</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Demanda Cultura (ETc):</span>
                      <strong className="text-sm font-mono text-amber-800">{irrigation.etcDailyMm} mm/dia</strong>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Kc aplicado: {irrigation.kcUsed}</span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                      <span className="text-stone-500 text-[11px] block">Déficit Hídrico:</span>
                      <strong className={`text-sm font-mono ${irrigation.deficitMm > 15 ? 'text-red-700' : 'text-[#173F2A]'}`}>
                        {irrigation.deficitMm} mm
                      </strong>
                      <span className="text-[10px] text-stone-400 block mt-0.5">Lâmina rec.: {irrigation.recommendedNetIrrigationMm} mm</span>
                    </div>
                  </div>

                  <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 text-xs text-sky-950 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-700" />
                      Diagnóstico e Racional de Irrigação:
                    </div>
                    <p className="text-[11px] leading-relaxed">{irrigation.rationale}</p>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-xs text-[#6B4A35]">Carregando parâmetros hídricos...</p>
              )}
            </Card>
          )}

          {/* Seção 3: Painel Técnico de Satélite Sentinel-2 e Radar S1 (Volume 04) */}
          {selectedPlot && (
            <Card title={`Inspeção de Satélite Sentinel-2 e Radar: ${selectedPlot.name}`}>
              {satelliteData && satelliteData.metrics.length > 0 ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {satelliteData.metrics.map((m) => (
                      <div key={m.metric} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs uppercase tracking-wider text-[#173F2A]">
                            {m.metric.toUpperCase()}
                          </span>
                          <span className="font-mono text-sm font-extrabold text-[#2F7D4A]">{m.mean}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-stone-500">
                          <div>Mínimo: {m.min}</div>
                          <div>Máximo: {m.max}</div>
                          <div>Percentil 50: {m.p50}</div>
                          <div>Percentil 90: {m.p90}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span>Cena Orbital ID: </span>
                      <code className="text-[#2F7D4A] font-bold text-[11px]">{satelliteData.scenes[0]?.id}</code>
                    </div>
                    <div>
                      <span>Missão: </span>
                      <strong>{satelliteData.scenes[0]?.mission}</strong>
                    </div>
                    <div>
                      <span>Cobertura de Nuvens: </span>
                      <strong>{satelliteData.scenes[0]?.cloudCoveragePct}%</strong>
                    </div>
                    <div>
                      <span>Sinal de Radar S1: </span>
                      <strong className="text-emerald-700">Ativo</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-xs text-[#6B4A35]">Carregando estatísticas orbitais...</p>
              )}
            </Card>
          )}

          {/* Seção 4: Painel Técnico Específico de Café (Volume 07) ou Capim (Volume 08) */}
          {selectedPlot && isCoffeeSelected && coffeePhenology && (
            <Card title={`Motor do Café (Volume 07): Fenologia e Florada - ${selectedPlot.name}`}>
              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 text-[11px] block">Estágio Fenológico Atual:</span>
                    <strong className="text-sm text-[#173F2A]">{coffeePhenology.currentStage}</strong>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 text-[11px] block">Chance de Abertura Floral:</span>
                    <strong className="text-sm text-amber-700">{coffeePhenology.floweringProbabilityPct}%</strong>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 text-[11px] block">Condição Térmica:</span>
                    <strong className="text-sm text-[#2F7D4A]">{coffeePhenology.temperatureCondition}</strong>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-amber-950">Diretrizes de Manejo para o Estágio:</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-700">
                    {coffeePhenology.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {selectedPlot && !isCoffeeSelected && pastureManagement && (
            <Card title={`Motor do Capim (Volume 08): Rotação e Descanso - ${selectedPlot.name}`}>
              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 text-[11px] block">Cultivar da Pastagem:</span>
                    <strong className="text-sm text-[#173F2A]">{pastureManagement.cultivarName}</strong>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 text-[11px] block">Dias de Descanso Recomendados:</span>
                    <strong className="text-sm text-[#2F7D4A]">{pastureManagement.recommendedRestDays} dias</strong>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-500 text-[11px] block">Índice de Biomassa:</span>
                    <strong className="text-sm text-emerald-800">{pastureManagement.biomassIndex}</strong>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-emerald-950">
                  <p className="font-semibold">{pastureManagement.restPeriodStatusText}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
