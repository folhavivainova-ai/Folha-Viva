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
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { EmptyState } from '../../components/ui/EmptyState';
import { OpenMapView } from '../map/OpenMapView';
import { ProducerProfile, Property, Plot, FieldEvent } from '../../domain/entities';
import { WeatherService, WeatherSummary } from '../../services/weatherProvider';

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

  // Buscar clima real a partir do centroid da propriedade ou primeiro talhão
  useEffect(() => {
    let lat = property.centroid?.lat;
    let lng = property.centroid?.lng;

    if ((!lat || !lng) && plots.length > 0 && plots[0].geometry.coordinates.length > 0) {
      lat = plots[0].geometry.coordinates[0][0];
      lng = plots[0].geometry.coordinates[0][1];
    }

    if (lat && lng) {
      setLoadingWeather(true);
      WeatherService.fetchWeather(lat, lng)
        .then((res) => setWeather(res))
        .catch(() => {})
        .finally(() => setLoadingWeather(false));
    }
  }, [property, plots]);

  // Se a lista de talhões mudar e o selecionado sumir
  useEffect(() => {
    if (!selectedPlot && plots.length > 0) {
      setSelectedPlot(plots[0]);
    }
  }, [plots, selectedPlot]);

  // Filtrar eventos do talhão selecionado
  const plotEvents = selectedPlot
    ? fieldEvents.filter((e) => e.plotId === selectedPlot.id)
    : fieldEvents;

  // Total de hectares da fazenda
  const totalHectares = plots.reduce((acc, p) => acc + (p.areaHa || 0), 0);
  const coffeePlots = plots.filter((p) => p.cropCycle?.cropType === 'coffee');
  const pasturePlots = plots.filter((p) => p.cropCycle?.cropType === 'pasture');

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
                  onClick={() => onOpenFieldNotebook(selectedPlot?.id)}
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
            </Card>
          </div>

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
                              Aguardando dados de campo
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
      {/* MODO TÉCNICO: PAINEL DE AUDITORIA E SÉRIES (V16-E04)           */}
      {/* ============================================================== */}
      {viewMode === 'technical' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mapa Amplo */}
            <div className="lg:col-span-2 space-y-4">
              <Card title="Inspeção Geoespacial Aberta">
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

            {/* Coluna Técnica com Metadados Transparentes (Apêndice M) */}
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
                  <li>Satélite: fonte de evidência, sem estimativas mágicas.</li>
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
        </div>
      )}
    </div>
  );
};
